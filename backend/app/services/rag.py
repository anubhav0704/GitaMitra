import os
import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, func, or_, and_, text
from app.models.gita import Verse
from app.models.rag import GitaEmbedding
from app.core.embeddings import get_embedding_provider

class RAGQueryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.provider = get_embedding_provider()
        
        # Load weights from config
        self.top_k = int(os.getenv("RAG_TOP_K", "5"))
        self.min_score = float(os.getenv("RAG_MIN_SCORE", "0.0"))
        
        self.semantic_weight = float(os.getenv("RAG_SEMANTIC_WEIGHT", "0.6"))
        self.keyword_weight = float(os.getenv("RAG_KEYWORD_WEIGHT", "0.2"))
        self.metadata_weight = float(os.getenv("RAG_METADATA_WEIGHT", "0.2"))

    @staticmethod
    def extract_verse_references(query: str) -> List[Tuple[int, int]]:
        """
        Extracts explicit Chapter and Verse numbers from user query.
        E.g. 'Chapter 2, Verse 32', 'Chapter 2 Verse 32', 'BG 2.32', '2:32', 'Gita 2.32', 'Verse 32 of Chapter 2'.
        """
        refs = []
        # Pattern 1: Chapter X, Verse Y (or Shloka/Sloka)
        m1 = re.findall(r'\b(?:chapter|adhyay)\s*(\d{1,2})\s*[,.:\s-]+\s*(?:verse|shloka|sloka|shlok)?\s*(\d{1,2})\b', query, re.IGNORECASE)
        for ch, vs in m1:
            refs.append((int(ch), int(vs)))

        # Pattern 2: Verse Y of Chapter X
        m2 = re.findall(r'\b(?:verse|shloka|sloka|shlok)\s*(\d{1,2})\s*(?:of|in)?\s*(?:chapter|adhyay)\s*(\d{1,2})\b', query, re.IGNORECASE)
        for vs, ch in m2:
            refs.append((int(ch), int(vs)))

        # Pattern 3: BG X.Y or Gita X.Y or standalone X.Y
        m3 = re.findall(r'\b(?:bg|gita|bhagavad\s*gita)?\s*(\d{1,2})[:.](\d{1,2})\b', query, re.IGNORECASE)
        for ch, vs in m3:
            pair = (int(ch), int(vs))
            if pair not in refs and 1 <= int(ch) <= 18:
                refs.append(pair)

        # Filter valid Gita chapters (1-18) and verses (1-78)
        return [(ch, vs) for ch, vs in refs if 1 <= ch <= 18 and 1 <= vs <= 78]

    @staticmethod
    def extract_quoted_phrases(query: str) -> List[str]:
        """Extracts quoted strings that might match verse translations."""
        quotes = re.findall(r'["“\']([^"”\']{10,})["”\']', query)
        return [q.strip() for q in quotes if len(q.strip()) >= 10]

    def analyze_query(self, query: str) -> Dict[str, List[str]]:
        """Lightweight query analysis to extract potential keywords/topics."""
        query_lower = query.lower()
        
        extracted = {
            "keywords": [],
            "topics": [],
            "emotions": [],
            "life_situations": []
        }
        
        # Rule-based extraction tailored to Gita themes
        emotions_map = {
            "fear": ["afraid", "scared", "fear", "anxious", "panic"],
            "anger": ["angry", "mad", "rage", "frustrated", "annoyed"],
            "sadness": ["sad", "depressed", "worthless", "grief", "loss", "lost", "crying", "died"],
            "confusion": ["confused", "lost", "don't know", "what to do", "doubt"],
            "jealousy": ["jealous", "envy", "jealousy", "envious"],
            "peace": ["peace", "calm", "serenity", "peace of mind"]
        }
        
        life_situations_map = {
            "career": ["career", "job", "work", "boss", "interview", "business", "vocation"],
            "failure": ["fail", "failing", "failed", "failure", "give up", "lose"],
            "success": ["success", "succeed", "win", "achieve"],
            "relationships": ["friend", "family", "love", "partner", "relationship"],
            "exam": ["exam", "test", "grade", "future"],
            "bereavement": ["died", "death", "mourning", "loss of loved one"]
        }
        
        concepts_map = {
            "duty": ["duty", "responsibility", "should i", "have to", "swadharma"],
            "karma": ["karma", "action", "results", "fruits", "reward", "work"],
            "detachment": ["let go", "detachment", "moving on", "attachment"],
            "God": ["god", "divine", "creator", "supreme", "nature of god", "brahman"],
            "meditation": ["meditation", "meditate", "mind", "peace of mind", "focus"],
            "death": ["death", "died", "soul", "afterlife", "immortality"],
            "anger": ["anger", "rage", "destroying peace"],
            "peace": ["peace", "peace of mind", "chaotic world"]
        }
        
        for key, words in emotions_map.items():
            if any(w in query_lower for w in words):
                extracted["emotions"].append(key)
                
        for key, words in life_situations_map.items():
            if any(w in query_lower for w in words):
                extracted["life_situations"].append(key)
                
        for key, words in concepts_map.items():
            if any(w in query_lower for w in words):
                extracted["topics"].append(key)
                
        # Simple word tokenization for keywords (ignoring stop words)
        words = re.findall(r'\w+', query_lower)
        stopwords = {"i", "am", "is", "are", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "my", "of", "it", "that", "this", "what", "how", "why", "so", "all", "do", "can", "please", "guide", "me", "chapter", "verse", "shloka"}
        extracted["keywords"] = [w for w in words if w not in stopwords and len(w) > 2]
        
        return extracted

    async def search(self, query: str, top_k: Optional[int] = None) -> Dict[str, Any]:
        """Hybrid search combining direct citation lookup, semantic, keyword, and metadata matching."""
        if top_k is None:
            top_k = self.top_k

        # 0. Check for explicit verse citations or quoted translations first
        explicit_refs = self.extract_verse_references(query)
        quoted_phrases = self.extract_quoted_phrases(query)
        exact_verses: List[Verse] = []

        if explicit_refs:
            for ch, vs in explicit_refs:
                stmt = select(Verse).where(
                    and_(Verse.chapter_number == ch, Verse.verse_number == vs)
                )
                res = await self.db.execute(stmt)
                v = res.scalar_one_or_none()
                if v and v not in exact_verses:
                    exact_verses.append(v)

        if quoted_phrases and not exact_verses:
            for q_phrase in quoted_phrases:
                tokens = re.findall(r'\w+', q_phrase.lower())
                if len(tokens) >= 3:
                    sample = " ".join(tokens[:6])
                    stmt = select(Verse).where(
                        or_(
                            Verse.translation_en.ilike(f"%{sample}%"),
                            Verse.translation_hi.ilike(f"%{sample}%"),
                            Verse.transliteration.ilike(f"%{sample}%")
                        )
                    ).limit(2)
                    res = await self.db.execute(stmt)
                    matches = res.scalars().all()
                    for m in matches:
                        if m not in exact_verses:
                            exact_verses.append(m)

        # 1. Analyze query
        analysis = self.analyze_query(query)
        
        candidates = []

        # If user explicitly asked for a specific verse, make sure it is at the front with max score
        exact_verse_ids = set()
        for ev in exact_verses:
            candidates.append((ev, 1.0))
            exact_verse_ids.add(ev.id)

        # If user explicitly asked for specific verses and we found them, we can limit broader search
        # to avoid polluting the prompt with irrelevant extra verses
        need_broader_search = (len(exact_verses) == 0) or (top_k > len(exact_verses))

        if need_broader_search:
            try:
                # 2. Get embedding
                query_embedding = self.provider.get_embedding(query)
                
                # 3. Perform Vector Search using cosine distance
                cosine_distance = GitaEmbedding.embedding.cosine_distance(query_embedding)
                similarity_score = 1 - cosine_distance
                
                stmt = (
                    select(
                        Verse,
                        similarity_score.label('semantic_score')
                    )
                    .join(GitaEmbedding, Verse.id == GitaEmbedding.verse_id)
                    .where(
                        or_(
                            GitaEmbedding.embedding_model == self.provider.model_name,
                            GitaEmbedding.embedding_model == "all-MiniLM-L6-v2",
                            GitaEmbedding.embedding_model == "mock-384"
                        )
                    )
                    .order_by(cosine_distance)
                    .limit(max(30, top_k * 5))
                )
                
                result = await self.db.execute(stmt)
                for v, score in result.all():
                    if v.id not in exact_verse_ids:
                        candidates.append((v, score))
            except Exception as vec_err:
                print(f"[RAG] Vector search error/fallback: {vec_err}")

            if not candidates:
                # Direct SQL fallback on Verse table
                fallback_stmt = select(Verse).limit(top_k * 2)
                if analysis["keywords"]:
                    conds = [Verse.translation_en.ilike(f"%{kw}%") for kw in analysis["keywords"][:3]]
                    fallback_stmt = select(Verse).where(or_(*conds)).limit(top_k * 2)
                fb_res = await self.db.execute(fallback_stmt)
                verses_fb = fb_res.scalars().all()
                candidates = [(v, 0.5) for v in verses_fb]

        
        # 4. Rerank with Hybrid Strategy
        ranked_results = []
        for verse, sem_score in candidates:
            semantic = max(0.0, float(sem_score))
            
            # Keyword Score
            keyword_score = 0.0
            if analysis["keywords"]:
                matched = 0
                searchable_text = f"{verse.translation_en} {verse.explanation_en or ''} {verse.transliteration} {verse.sanskrit}".lower()
                for kw in analysis["keywords"]:
                    if kw in searchable_text:
                        matched += 1
                keyword_score = matched / len(analysis["keywords"])
                
            # Metadata Score
            metadata_score = 0.0
            meta_features = []
            if verse.emotions: meta_features.extend([e.lower() for e in verse.emotions])
            if verse.life_situations: meta_features.extend([l.lower() for l in verse.life_situations])
            if verse.topics: meta_features.extend([t.lower() for t in verse.topics])
            if verse.concepts: meta_features.extend([c.lower() for c in verse.concepts])
            
            query_features = [f.lower() for f in (analysis["emotions"] + analysis["life_situations"] + analysis["topics"])]
            if query_features and meta_features:
                matched = sum(1 for qf in query_features if qf in meta_features)
                metadata_score = matched / len(query_features)
                
            # Dynamically normalize weights based on active feature availability
            total_weight = self.semantic_weight
            score = self.semantic_weight * semantic
            
            if analysis["keywords"]:
                total_weight += self.keyword_weight
                score += self.keyword_weight * keyword_score
                
            if query_features:
                total_weight += self.metadata_weight
                score += self.metadata_weight * metadata_score
                
            final_score = score / total_weight if total_weight > 0 else semantic
            
            ranked_results.append({
                "verse": verse,
                "score": final_score,
                "semantic_score": semantic,
                "keyword_score": keyword_score,
                "metadata_score": metadata_score
            })
            
        # 5. Sort by final score
        ranked_results.sort(key=lambda x: x["score"], reverse=True)
        
        if ranked_results:
            top = ranked_results[0]
            print(f"Top Candidate Final Score: {top['score']:.4f} (Sem: {top['semantic_score']:.4f}, KW: {top['keyword_score']:.4f}, Meta: {top['metadata_score']:.4f})")
        
        # 6. Apply threshold and top_k
        final_list = []
        has_high_confidence = any(item["score"] >= 0.7 for item in ranked_results)
        dynamic_min_score = 0.35 if has_high_confidence else self.min_score

        for item in ranked_results:
            if item["score"] >= dynamic_min_score:
                final_list.append(item)
                
            if len(final_list) >= top_k:
                break
                
        # 7. Format RAG Context Object
        results_formatted = []
        for item in final_list:
            verse = item["verse"]
            results_formatted.append({
                "reference": f"Bhagavad Gita {verse.verse_key}",
                "chapter": verse.chapter_number,
                "verse": verse.verse_number,
                "relevance_score": round(item["score"], 4),
                "sanskrit": verse.sanskrit,
                "translation_en": verse.translation_en,
                "translation_hi": verse.translation_hi,
                "explanation_en": verse.explanation_en,
                "topics": verse.topics or [],
                "concepts": verse.concepts or [],
                "life_situations": verse.life_situations or []
            })
            
        return {
            "query": query,
            "has_relevant_context": len(results_formatted) > 0,
            "results": results_formatted,
            "analysis": analysis  # useful for debugging
        }

class RAGContextBuilder:
    @staticmethod
    def build_llm_context(rag_result: Dict[str, Any]) -> str:
        """Converts retrieved verses into clean context string for LLM."""
        if not rag_result.get("has_relevant_context"):
            return "No highly relevant Bhagavad Gita verses found for the current query."
            
        parts = ["Relevant Bhagavad Gita teachings:\n"]
        
        for item in rag_result["results"]:
            parts.append(f"{item['reference']}")
            parts.append(f"Sanskrit:\n{item['sanskrit']}")
            parts.append(f"Translation:\n{item['translation_en']}")
            
            if item.get("explanation_en"):
                parts.append(f"Explanation:\n{item['explanation_en']}")
                
            tags = item["topics"] + item["concepts"]
            if tags:
                parts.append(f"Related themes: {', '.join(tags)}")
            
            parts.append("-" * 40)
            
        return "\n".join(parts)
