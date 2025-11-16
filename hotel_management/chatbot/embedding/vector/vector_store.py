import chromadb
from chromadb.config import Settings
from typing import List, Dict
from django.conf import settings
import threading

class VectorStore:
    """Quản lý ChromaDB"""
    _instance = None
    _lock = threading.Lock()
    _client = None
    
    def __new__(cls):
        """Singleton pattern - chỉ tạo một instance duy nhất"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(VectorStore, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if VectorStore._client is None:
            with self._lock:
                if VectorStore._client is None:
                    client = chromadb.PersistentClient(
                        path=settings.CHROMA_PATH,
                        settings=Settings(anonymized_telemetry=False)
                    )
                    VectorStore._client = client
        self._client = VectorStore._client
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
    @property
    def client(self):
        """Get model instance - đảm bảo model đã được load"""
        if VectorStore._client is None:
            self.__init__()
        return VectorStore._client
        
    
    def add_documents(self, documents: List[Dict]):
        """
        Thêm documents vào ChromaDB
        documents = [
            {"id": "1", "text": "...", "metadata": {"title": "..."}},
            ...
        ]
        """
        from chatbot.embedding.service.embedding import EmbeddingService
        
        # Reuse singleton instance - không tạo mới mỗi lần
        embedding_service = EmbeddingService()
        
        texts = [doc["text"] for doc in documents]
        embeddings = embedding_service.embed_documents(texts)
        
        self.collection.add(
            ids=[doc["id"] for doc in documents],
            embeddings=embeddings,
            documents=texts,
            metadatas=[doc.get("metadata", {}) for doc in documents]
        )
    
    def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """Tìm kiếm documents tương tự"""
        from chatbot.embedding.service.embedding import EmbeddingService
        
        # Reuse singleton instance - không tạo mới mỗi lần
        embedding_service = EmbeddingService()
        query_embedding = embedding_service.embed_query(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format kết quả
        retrieved_docs = []
        for i in range(len(results['documents'][0])):
            retrieved_docs.append({
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "score": 1 - results['distances'][0][i]  # Cosine similarity
            })
        
        return retrieved_docs
    
    def delete_all(self):
        """Xóa toàn bộ collection (để rebuild)"""
        self.client.delete_collection("knowledge_base")
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )