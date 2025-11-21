from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import projects, reviews, auth
from app.database.config import connect_db, disconnect_db
from pathlib import Path
import os
import json
import torch
import openai
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings


# -------------------------------------------------------------------
# FastAPI setup
# -------------------------------------------------------------------
def resolve_device():
    """Return the best available torch device for embeddings."""
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass
    return "cpu"


load_dotenv()


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
    device = resolve_device()
    print(f"Embedding model device: {device}")

    embedding = OpenAIEmbeddings(
        model="text-embedding-3-small", api_key=get_openai_api_key()
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


# -------------------------------------------------------------------
# RAG chatbot endpoint
# -------------------------------------------------------------------


# Initialize FastAPI app
app = FastAPI(
    title="E-निरीक्षण API",
    description="API for Government Procurement Transparency Platform - Tracking tender data and project progress",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Database event handlers
@app.on_event("startup")
async def startup():
    """Connect to database on startup"""
    await connect_db()

    async def startup_event():
        try:
            get_rag_retriever()
            print("[RAG] Startup: retriever ready.")
        except Exception as e:
            # Don't crash on startup; endpoint will still try to initialize later
            print(f"[RAG] Failed to initialize retriever on startup: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Disconnect from database on shutdown"""
    await disconnect_db()


# Configure CORS - Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(reviews.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "E-निरीक्षण API",
        "description": "Government Procurement Transparency Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "authentication": "/api/auth",
            "projects": "/api/projects",
            "reviews": "/api/reviews",
            "statistics": "/api/projects/stats/overview",
            "filters": "/api/projects/filters/options",
        },
    }


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
        "You are an assistant that helps people understand official government procedures, "
        "required documents, and official fees in Nepal. Your main goal is to prevent citizens "
        "from being exploited, overcharged, or misled by bureaucrats.\n\n"
        "You are given some legal and procedural context below (laws, regulations, notices, "
        "and guidelines). Treat this a primary reference.\n\n"
        "When you answer questions:\n"
        "- Focus on explaining:\n"
        "  • What the process is (step by step).\n"
        "  • Which office or authority is responsible.\n"
        "  • What documents are required.\n"
        "  • What are the costs to be paid if any.\n"
        #    "- If the context clearly states the fee or required documents, use those exact details.\n"
        #    "- If the context is partial or does not mention everything, use your general understanding "
        #    "  of Nepal’s administrative practices to give a helpful and realistic answer.\n"
        "- Always make it clear that only officially prescribed fees should be paid. Politely remind "
        "  users that they are not required to pay any extra or unofficial amount beyond the official "
        "  government fee, and that they should always ask for an official receipt.\n"
        "- If a user describes a situation that looks like bribery, overcharging, or harassment, "
        "  calmly explain that such demands are not legal and suggest that they can:\n"
        "  • Refuse to pay unofficial fees.\n"
        "  • Ask for written/official notice of any fee.\n"
        "  • Record details (date, office, name of officer, amount asked).\n"
        "  • Contact the appropriate complaint or anti-corruption channel in Nepal.\n"
        "- If the question is clearly unrelated to government procedures, laws or corruption, answer "
        "  briefly or explain that you are focused on administrative and legal information.\n\n"
        "Style guidelines:\n"
        "- Answer using the language of the user content (English or Nepali).\n"
        "- Prefer bullet points and short steps instead of long paragraphs.\n"
        "- Mention, where possible, which law, rule, or type of official document your answer is based on.\n"
        "Below is the context you can use:\n\n"
        "CONTEXT:\n"
        f"{context_text}\n\n"
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

    return JSONResponse({"messages": messages})


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cmd-transparency-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
