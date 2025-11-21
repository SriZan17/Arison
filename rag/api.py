import os
import json

import openai
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# -------------------------------------------------------------------
# FastAPI setup
# -------------------------------------------------------------------

load_dotenv()

app = FastAPI(
    title="RAG Chat API",
    version="0.1.0",
    docs_url="/",  # swagger at root, like your working app
)


# -------------------------------------------------------------------
# RAG globals
# -------------------------------------------------------------------

RAG_PERSIST_DIR = "./chroma_db"

rag_vectorstore = None
rag_retriever = None


def get_openai_api_key() -> str:
    """Use MATE if set, otherwise fall back to OPENAI_API_KEY."""
    key = os.getenv("RAG_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="No API key found. Set MATE or OPENAI_API_KEY in your .env.",
        )
    print(key)
    return key


def get_rag_retriever():
    """Lazy-load Chroma + HuggingFaceEmbeddings and return a retriever."""
    global rag_vectorstore, rag_retriever

    if rag_retriever is not None:
        return rag_retriever

    if not os.path.exists(RAG_PERSIST_DIR):
        raise HTTPException(
            status_code=500,
            detail=f"Vector DB not found at {RAG_PERSIST_DIR}. Run your ingestion script first.",
        )

    # Use same embedding model/config as ingestion
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[RAG] Using device for embeddings: {device}")

    embedding = HuggingFaceEmbeddings(
        model_name="intfloat/multilingual-e5-base",
        model_kwargs={"device": "cpu"},
    )

    rag_vectorstore = Chroma(
        persist_directory=RAG_PERSIST_DIR,
        embedding_function=embedding,
    )

    rag_retriever = rag_vectorstore.as_retriever(search_kwargs={"k": 3})
    print("[RAG] Retriever initialized.")
    return rag_retriever


def _latest_user_text(messages) -> str:
    """Extract latest user message content from chat history."""
    for m in reversed(messages):
        if m.get("role") == "user":
            return (m.get("content") or "").strip()
    return ""


def _format_context(docs) -> str:
    """Turn Chroma documents into a context block for the system prompt."""
    parts = []
    for d in docs:
        source = d.metadata.get("source", "Unknown")
        page = d.metadata.get("page", "Unknown")
        parts.append(f"Source: {source}, Page: {page}\n{d.page_content}")
    return "\n\n---\n\n".join(parts)


# -------------------------------------------------------------------
# Startup (optional pre-load)
# -------------------------------------------------------------------


@app.on_event("startup")
async def startup_event():
    try:
        get_rag_retriever()
        print("[RAG] Startup: retriever ready.")
    except Exception as e:
        # Don't crash on startup; endpoint will still try to initialize later
        print(f"[RAG] Failed to initialize retriever on startup: {e}")


# -------------------------------------------------------------------
# RAG chatbot endpoint
# -------------------------------------------------------------------


@app.post("/chatbot")
async def rag_chatbot_endpoint(request: Request):
    """
    RAG-enabled chatbot.

    Request JSON:
      {
        "messages": [
          {"role": "user", "content": "..."}, ...
        ]
      }

    Response JSON:
      {
        "messages": [..., {"role": "assistant", "content": "..."}],
        "sources": [
          {"source": "file.pdf", "page": 3},
          ...
        ]
      }
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    messages = data.get("messages")
    if messages is None or not isinstance(messages, list) or not messages:
        raise HTTPException(
            status_code=400,
            detail="'messages' must be a non-empty list of chat messages.",
        )

    # Extract latest user query
    query = _latest_user_text(messages)
    if not query:
        raise HTTPException(
            status_code=400,
            detail="No user message found in 'messages'.",
        )

    # 1) RAG retrieval
    retriever = get_rag_retriever()
    try:
        docs = retriever.invoke(query)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving context from vector DB: {e}",
        )

    context_text = _format_context(docs)

    # 2) Build RAG-aware system prompt
    system_prompt = (
        "You are a retrieval-augmented assistant who helps Nepali citizens.\n"
        "You answer questions using ONLY the context provided below.\n"
        "If the answer is not clearly supported by the context, say you don't know.\n\n"
        "CONTEXT:\n"
        f"{context_text}\n\n"
        "When you answer, be clear and concise. If relevant, mention which section or law you are referring to."
    )

    # Compose final messages: system + existing conversation
    full_messages = [
        {"role": "system", "content": system_prompt},
    ] + messages

    # 3) Call OpenAI directly (no helper)
    api_key = get_openai_api_key()
    client = openai.OpenAI(api_key=api_key)

    try:
        resp = client.chat.completions.create(
            model="gpt-5-mini-2025-08-07",
            messages=full_messages,
            top_p=1,
            presence_penalty=0,
            frequency_penalty=0,
        )
        reply = resp.choices[0].message.content
    except openai.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")

    # Append the assistant's reply to the conversation
    messages.append({"role": "assistant", "content": reply})

    # Prepare sources as a separate list (for UI if needed)
    sources = []
    for d in docs:
        sources.append(
            {
                "source": d.metadata.get("source", "Unknown"),
                "page": d.metadata.get("page", -1),
            }
        )

    return JSONResponse({"messages": messages, "sources": sources})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
