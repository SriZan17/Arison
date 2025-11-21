import os
import sys
import json
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_classic.chains import RetrievalQA  # classic API

# Load environment variables
load_dotenv()

# Still needed for ChatOpenAI (LLM). If you want to remove OpenAI entirely,
# we can swap this to a HuggingFace LLM later.
if not os.getenv("OPENAI_API_KEY"):
    print("Error: OPENAI_API_KEY not found in .env file")
    sys.exit(1)


def load_pdfs(filepaths):
    """Loads PDFs from the given list of filepaths."""
    documents = []
    for filepath in filepaths:
        filename = os.path.basename(filepath)
        print(f"Loading {filename}...")
        try:
            loader = PyPDFLoader(filepath)
            docs = loader.load()
            # Ensure 'source' is a clean filename in metadata
            for d in docs:
                d.metadata["source"] = filename
            documents.extend(docs)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    return documents


def get_pdf_state(state_path):
    """Load or initialize the JSON file that tracks processed PDFs."""
    if os.path.exists(state_path):
        try:
            with open(state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            # If the file is corrupted, start fresh
            return {}
    return {}


def save_pdf_state(state_path, state):
    """Save processed PDF state to disk."""
    os.makedirs(os.path.dirname(state_path), exist_ok=True)
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def find_new_or_updated_pdfs(pdf_dir, state):
    """
    Compare files in `pdf_dir` against recorded state.
    Returns:
      - list of filepaths that are new or modified
      - updated state dict
    """
    updated_state = dict(state)  # copy
    new_or_changed_files = []

    if not os.path.exists(pdf_dir):
        print(f"Directory {pdf_dir} does not exist.")
        return [], updated_state

    for filename in os.listdir(pdf_dir):
        if not filename.lower().endswith(".pdf"):
            continue

        full_path = os.path.join(pdf_dir, filename)
        try:
            mtime = os.path.getmtime(full_path)
        except OSError:
            continue

        # state structure: { "file.pdf": { "mtime": 123456789.0 } }
        prev = updated_state.get(filename)
        if prev is None or prev.get("mtime") != mtime:
            # New or modified PDF
            new_or_changed_files.append(full_path)
            updated_state[filename] = {"mtime": mtime}

    return new_or_changed_files, updated_state


def main():
    pdf_dir = "pdfs"
    persist_directory = "./chroma_db"
    state_file = "./chroma_db/pdf_state.json"

    print("Initializing RAG system (incremental mode)...")

    # 1. Determine which PDFs are new or changed
    pdf_state = get_pdf_state(state_file)
    new_files, updated_state = find_new_or_updated_pdfs(pdf_dir, pdf_state)

    if not new_files and not os.path.isdir(persist_directory):
        print("No PDFs to process and no existing vector store found. Exiting.")
        return

    if new_files:
        print(f"Found {len(new_files)} new/updated PDF(s):")
        for f in new_files:
            print(f" - {os.path.basename(f)}")
    else:
        print("No new or updated PDFs. Using existing vector store only.")

    # 2. Initialize embeddings and (possibly existing) vector store
    # ✅ HuggingFace embeddings instead of OpenAIEmbeddings
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )

    # This will load existing DB if present, or create a new empty one
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding,
    )

    # 3. If there are new/changed PDFs, load + split + add them
    if new_files:
        documents = load_pdfs(new_files)
        if documents:
            print(f"Loaded {len(documents)} pages from new/updated PDFs.")

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            splits = text_splitter.split_documents(documents)
            print(f"Split new documents into {len(splits)} chunks.")

            print("Adding new chunks to vector store...")
            vectorstore.add_documents(splits)
            vectorstore.persist()

            # Update state file now that indexing succeeded
            save_pdf_state(state_file, updated_state)
            print("Updated PDF state saved.")
        else:
            print("No documents loaded from new files (errors or empty).")

    # 4. Build RetrievalQA chain over the (now updated) vector store
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
        return_source_documents=True
    )

    print("\nRAG System Ready! Type 'exit' to quit.\n")

    while True:
        query = input("Enter your question: ")
        if query.lower() in ['exit', 'quit', 'q']:
            break

        if not query.strip():
            continue

        try:
            result = qa_chain.invoke({"query": query})
            print("\n--- Answer ---")
            print(result['result'])
            print("\n--- Sources ---")
            for doc in result['source_documents']:
                print(f"- {doc.metadata.get('source', 'Unknown')}, Page {doc.metadata.get('page', 'Unknown')}")
            print("\n" + "-" * 30 + "\n")
        except Exception as e:
            print(f"Error processing query: {e}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
