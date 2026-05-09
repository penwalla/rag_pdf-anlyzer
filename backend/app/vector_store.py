from langchain_community.vectorstores import FAISS
from langchain_core.vectorstores import VectorStoreRetriever
from typing import Dict

class VectorStoreManager:
    def __init__(self):
        self.sessions: Dict[str, FAISS] = {}
    
    def add_session(self, session_id: str, vectorstore: FAISS):
        self.sessions[session_id] = vectorstore
    
    def get_retriever(self, session_id: str) -> VectorStoreRetriever:
        if session_id not in self.sessions:
            raise ValueError("Session ID not found")
        return self.sessions[session_id].as_retriever(
            search_type="mmr", 
            search_kwargs={"k": 5, "fetch_k": 10}
        )
    
    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions

vector_store_manager = VectorStoreManager()