import os
import tempfile
import re
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


def clean_markdown(text):
    text = re.sub(r'^[\s*\-•]+', '', text, flags=re.MULTILINE)
    text = text.replace('*', '').replace('#', '').replace('`', '')
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


def process_pdf(file_bytes: bytes) -> FAISS:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # Load PDF
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()

        # Split text
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        docs = splitter.split_documents(documents)

        # ✅ Hugging Face embeddings (LATEST)
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # Create FAISS vector store
        vectorstore = FAISS.from_documents(docs, embeddings)
        return vectorstore

    finally:
        os.unlink(tmp_path)
