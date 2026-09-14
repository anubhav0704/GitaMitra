import asyncio
from app.llm.factory import get_llm_provider
from app.llm.prompt_builder import PromptBuilder

async def main():
    print("Testing Live LLM Provider configured via get_llm_provider()...")
    provider = get_llm_provider()
    print(f"Active Provider: {provider.__class__.__name__}, Model: {provider.model}")

    system_prompt = PromptBuilder.load_system_prompt()
    prompt = "A student asks: I am scared about failing my exam tomorrow. What does the Gita say about duty and results?"

    print("\n--- Generating Response from Live LLM ---")
    resp = await provider.generate(prompt=prompt, system_prompt=system_prompt, max_tokens=300)
    print("Response Content:\n", resp.content)
    print("\nUsage:", resp.usage)

    print("\n--- Streaming Tokens Test ---")
    tokens = []
    async for tok in provider.stream(prompt=prompt, system_prompt=system_prompt, max_tokens=150):
        tokens.append(tok)
        print(tok, end="", flush=True)
    print(f"\n\nStreamed {len(tokens)} token chunks successfully!")

if __name__ == "__main__":
    asyncio.run(main())
