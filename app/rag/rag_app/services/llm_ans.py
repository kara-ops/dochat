from groq import AsyncGroq
from app.core.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# Backend-injected separator — never emitted by the LLM, guaranteed unique
_SEP = b'__DOCCHAT_SEP__'
_THINK_CLOSE = b'</think>'
_THINK_OPEN  = b'<think>'
_MISSING = object()  # sentinel to distinguish "attribute absent" from "attribute = None"


async def generate_ans(ques: str, chunks: list[str]):
    formatted = "\n\n".join(
        f"[{i+1}] {c['filename']} (chunk {c['chunk_index']}):\n{c['content']}"
        for i, c in enumerate(chunks)
    )

    # Simple, clean prompt — no format instructions that cause the model to
    # over-verify. The thinking / answer split is handled at the stream level.
    prompt_str = f"""You are a document Q&A assistant.
Answer the question using ONLY the provided sources. Be concise.
Cite sources inline as [1], [2] etc. after each relevant claim.
If the answer is not in the sources, say "Not found in the documents."

Sources:
{formatted}

Question: {ques}"""

    result = await client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[{"role": "user", "content": prompt_str}],
        stream=True,
        temperature=0,
    )

    buf = b""          # running buffer for </think> detection
    sep_sent = False   # have we emitted the separator yet?
    use_api_sep = None # True = Groq gives us reasoning_content, False = inline tags

    async for chunk in result:
        delta = chunk.choices[0].delta

        # ── Detect whether this model exposes reasoning_content (Groq API) ──
        reasoning = getattr(delta, "reasoning_content", _MISSING)
        content_str = delta.content or ""
        content = content_str.encode("utf-8")

        if use_api_sep is None:
            use_api_sep = reasoning is not _MISSING

        # ── Branch 1: clean API-level separation ──────────────────────────
        if use_api_sep:
            if reasoning and reasoning is not _MISSING:
                yield reasoning.encode("utf-8")
            if content:
                if not sep_sent:
                    sep_sent = True
                    yield _SEP
                yield content
            continue

        # ── Branch 2: inline <think>…</think> detection ───────────────────
        if sep_sent:
            # Already past thinking — stream answer directly
            yield content
            continue

        buf += content
        close_pos = buf.find(_THINK_CLOSE)

        if close_pos != -1:
            # Found </think> — split here
            sep_sent = True
            think_part = buf[:close_pos].replace(_THINK_OPEN, b"").strip()
            if think_part:
                yield think_part
            yield _SEP
            answer_part = buf[close_pos + len(_THINK_CLOSE):].strip()
            if answer_part:
                yield answer_part
            buf = b""
        else:
            # Still inside thinking — yield what we're sure isn't part of </think>
            safe_len = max(0, len(buf) - len(_THINK_CLOSE))
            if safe_len:
                safe = buf[:safe_len].replace(_THINK_OPEN, b"")
                buf = buf[safe_len:]
                if safe:
                    yield safe

    # ── Flush remainder ───────────────────────────────────────────────────
    if buf:
        if not sep_sent:
            # Never saw </think> — treat everything as the answer
            yield _SEP
        clean = buf.replace(_THINK_OPEN, b"").replace(_THINK_CLOSE, b"").strip()
        if clean:
            yield clean
