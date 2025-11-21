import os
import sys
import json
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def load_pdfs(filepaths):
    """Loads PDFs but logs empty PDFs to empty.txt."""
    documents = []
    empty_log_path = "empty.txt"

    for filepath in filepaths:
        filename = os.path.basename(filepath)
        print(f"Loading {filename}...")

        try:
            loader = PyPDFLoader(filepath)
            docs = loader.load()

            # If PDF parses but contains no text/pages
            if not docs:
                print(f"⚠️  {filename} has 0 pages. Logging to {empty_log_path}")
                with open(empty_log_path, "a", encoding="utf-8") as f:
                    f.write(filename + "\n")
                continue

            # Normal case: attach metadata and keep
            for d in docs:
                d.metadata["source"] = filename

            documents.extend(docs)

        except Exception as e:
            # Errors are not considered "empty" PDFs → just print the error
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
      - list of tuples: (full_path, filename, mtime)
    """
    new_files = []

    if not os.path.exists(pdf_dir):
        print(f"Directory {pdf_dir} does not exist.")
        return new_files

    for filename in os.listdir(pdf_dir):
        if not filename.lower().endswith(".pdf"):
            continue

        full_path = os.path.join(pdf_dir, filename)
        try:
            mtime = os.path.getmtime(full_path)
        except OSError:
            continue

        prev = state.get(filename)
        if prev is None or prev.get("mtime") != mtime:
            # New or modified PDF
            new_files.append((full_path, filename, mtime))

    return new_files


# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

def main():
    load_dotenv()
    # OPENAI_API_KEY only needed if you use ChatOpenAI elsewhere;
    # kept here in case you extend later.
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in .env file")
        sys.exit(1)

    pdf_dir = "pdf2"
    persist_directory = "./chroma_db"
    state_file = "./chroma_db/pdf_state.json"
    empty_log_path = "empty.txt"

    print("Initializing RAG system (incremental, one-file-at-a-time)...")

    # 1. Determine which PDFs are new or changed
    pdf_state = get_pdf_state(state_file)
    new_files = find_new_or_updated_pdfs(pdf_dir, pdf_state)

    if not new_files and not os.path.isdir(persist_directory):
        print("No PDFs to process and no existing vector store found. Exiting.")
        return

    if new_files:
        print(f"Found {len(new_files)} new/updated PDF(s):")
        for _, filename, _ in new_files:
            print(f" - {filename}")
    else:
        print("No new or updated PDFs. Using existing vector store only.")

    # 2. Initialize embeddings and (possibly existing) vector store
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )

    # This will load existing DB if present, or create a new empty one
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding,
    )

    # 3. Process each new/changed PDF ONE BY ONE
    if new_files:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        for full_path, filename, mtime in new_files:
            print(f"\n🔹 Processing file: {filename}")

            documents = load_pdfs([full_path])
            if not documents:
                print(f"Skipping {filename}: no documents loaded.")
                continue

            print(f"Loaded {len(documents)} pages from {filename}.")

            splits = text_splitter.split_documents(documents)
            print(f"Split {filename} into {len(splits)} chunks.")

            # If there are no chunks (e.g. scanned/image-only PDF), skip and log
            if not splits:
                print(f"⚠️  {filename} produced 0 chunks. Logging to {empty_log_path} and skipping.")
                with open(empty_log_path, "a", encoding="utf-8") as f:
                    f.write(filename + "\n")
                continue  # do NOT call add_documents

            print(f"Adding chunks for {filename} to vector store...")
            vectorstore.add_documents(splits)

            # Update state for THIS file only and save
            pdf_state[filename] = {"mtime": mtime}
            save_pdf_state(state_file, pdf_state)
            print(f"✅ Finished {filename} and updated state.")

    print("\nRAG System Ready! (Vector store updated.)\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
