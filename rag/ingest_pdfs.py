import os
import sys
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# Load environment variables
load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    print("Error: OPENAI_API_KEY not found in .env file")
    sys.exit(1)

def load_pdfs(directory):
    """Loads all PDFs from the specified directory."""
    documents = []
    if not os.path.exists(directory):
        print(f"Directory {directory} does not exist.")
        return []
    
    for filename in os.listdir(directory):
        if filename.endswith(".pdf"):
            filepath = os.path.join(directory, filename)
            print(f"Loading {filename}...")
            try:
                loader = PyPDFLoader(filepath)
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    return documents

def main():
    pdf_dir = "pdfs"
    persist_directory = "./chroma_db"
    
    print("Initializing RAG ingestion...")
    
    # 1. Load Documents
    documents = load_pdfs(pdf_dir)
    if not documents:
        print("No documents loaded. Exiting.")
        return

    print(f"Loaded {len(documents)} pages from PDFs.")

    # 2. Split Text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(documents)
    print(f"Split into {len(splits)} chunks.")

    # 3. Create Embeddings and Vector Store
    print("Creating embeddings and vector store...")
    embedding = OpenAIEmbeddings()
    
    # Create/Update vector store
    Chroma.from_documents(
        documents=splits,
        embedding=embedding,
        persist_directory=persist_directory
    )
    
    print(f"Successfully ingested documents into {persist_directory}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
