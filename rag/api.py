import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA

# Load environment variables
load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    print("Error: OPENAI_API_KEY not found in .env file")
    sys.exit(1)

app = FastAPI(title="RAG Chat API")

# Global variables for the chain
qa_chain = None

def get_qa_chain():
    global qa_chain
    if qa_chain:
        return qa_chain
    
    persist_directory = "./chroma_db"
    
    if not os.path.exists(persist_directory):
        raise RuntimeError(f"Vector DB not found at {persist_directory}. Please run ingest_pdfs.py first.")

    print("Loading vector store...")
    embedding = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding
    )
    
    print("Creating retrieval chain...")
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
        return_source_documents=True
    )
    return qa_chain

@app.on_event("startup")
async def startup_event():
    try:
        get_qa_chain()
    except Exception as e:
        print(f"Failed to initialize QA chain: {e}")

class Query(BaseModel):
    question: str

class Source(BaseModel):
    source: str
    page: int

class Answer(BaseModel):
    result: str
    sources: list[Source]

@app.post("/chat", response_model=Answer)
async def chat(query: Query):
    chain = get_qa_chain()
    if not chain:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        result = chain.invoke({"query": query.question})
        
        sources = []
        for doc in result.get('source_documents', []):
            sources.append(Source(
                source=doc.metadata.get('source', 'Unknown'),
                page=doc.metadata.get('page', -1)
            ))
            
        return Answer(result=result['result'], sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
