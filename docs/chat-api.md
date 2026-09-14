# GitaMitra Chat API Contract

All endpoints require authentication (either via HttpOnly session cookie or `Authorization: Bearer <token>` header).

---

## 1. Conversations API

### List Conversations
- **Endpoint**: `GET /api/conversations`
- **Response**: `200 OK`
```json
[
  {
    "id": "04e38e07-b677-4efc-b03e-71d0ef9472cb",
    "user_id": "9d8f46fc-9d87-4296-9d10-877dfa91d06c",
    "title": "Interview Anxiety",
    "created_at": "2026-09-13T13:40:00Z",
    "updated_at": "2026-09-13T13:42:00Z"
  }
]
```

### Create Conversation
- **Endpoint**: `POST /api/conversations`
- **Request Body (optional)**:
```json
{
  "title": "Career and Dharma"
}
```
- **Response**: `200 OK` or `201 Created`

### Get Conversation Detail with Messages
- **Endpoint**: `GET /api/conversations/{id}`
- **Response**: `200 OK`
```json
{
  "id": "04e38e07-b677-4efc-b03e-71d0ef9472cb",
  "user_id": "9d8f46fc-9d87-4296-9d10-877dfa91d06c",
  "title": "Interview Anxiety",
  "created_at": "2026-09-13T13:40:00Z",
  "updated_at": "2026-09-13T13:42:00Z",
  "messages": [
    {
      "id": "d1b35799-3c41-4728-b4c1-530857b8e254",
      "conversation_id": "04e38e07-b677-4efc-b03e-71d0ef9472cb",
      "role": "user",
      "content": "I am terrified that I will fail my upcoming interview.",
      "created_at": "2026-09-13T13:40:10Z"
    },
    {
      "id": "f0b4e4fb-9db7-4580-862d-b18d762c16b6",
      "conversation_id": "04e38e07-b677-4efc-b03e-71d0ef9472cb",
      "role": "assistant",
      "content": "### Understanding\nI completely understand the anxiety...",
      "created_at": "2026-09-13T13:40:12Z"
    }
  ]
}
```

### Delete Conversation
- **Endpoint**: `DELETE /api/conversations/{id}`
- **Response**: `204 No Content`

---

## 2. Chat API

### Non-Streaming Chat
- **Endpoint**: `POST /api/chat`
- **Request Body**:
```json
{
  "message": "I feel afraid of failing my upcoming examination.",
  "conversation_id": "04e38e07-b677-4efc-b03e-71d0ef9472cb" // optional
}
```
- **Response**: `200 OK`
```json
{
  "conversation_id": "04e38e07-b677-4efc-b03e-71d0ef9472cb",
  "user_message_id": "d1b35799-3c41-4728-b4c1-530857b8e254",
  "assistant_message_id": "f0b4e4fb-9db7-4580-862d-b18d762c16b6",
  "response": "### Understanding\nI hear your concern...",
  "references": [
    {
      "reference": "Bhagavad Gita 2.47",
      "chapter": 2,
      "verse": 47,
      "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...",
      "translation_en": "Your right is only to work, but not to its results...",
      "translation_hi": "कर्म करने में ही तेरा अधिकार है...",
      "relevance_score": 0.3751
    }
  ],
  "emotions": ["fear"],
  "has_relevant_context": true
}
```

### Streaming Chat (Server-Sent Events)
- **Endpoint**: `POST /api/chat/stream`
- **Headers**: `Accept: text/event-stream`
- **Request Body**:
```json
{
  "message": "How do I control anger and bring stillness to the mind?",
  "conversation_id": "04e38e07-b677-4efc-b03e-71d0ef9472cb" // optional
}
```
- **Response Headers**: `Content-Type: text/event-stream`
- **Stream Event Sequence**:
1. `event: init`
   ```json
   data: {"conversation_id": "...", "user_message_id": "..."}
   ```
2. `event: retrieval`
   ```json
   data: {"count": 3, "references": [...], "emotions": ["anger"]}
   ```
3. `event: token` (repeated for each streamed chunk)
   ```json
   data: {"token": "### Understanding\n"}
   ```
4. `event: complete`
   ```json
   data: {"conversation_id": "...", "assistant_message_id": "...", "references": [...], "has_relevant_context": true}
   ```
5. `event: error` (if exception occurs)
   ```json
   data: {"error": "Description"}
   ```
