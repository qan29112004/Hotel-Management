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
                    # Chuyển sang dùng HttpClient kết nối tới server
                    client = chromadb.HttpClient(
                        host=settings.CHROMA_SERVER_HOST,
                        port=settings.CHROMA_SERVER_PORT
                    )
                    VectorStore._client = client
        self._client = VectorStore._client
        # get_or_create_collection call remains same
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
    
    def get_client(self):
        return chromadb.HttpClient(
            host=settings.CHROMA_SERVER_HOST,
            port=settings.CHROMA_SERVER_PORT
        )
        
    def get_collection(self):
        # Recommend reusing self.client instead of creating new client every time
        # but following existing pattern for safety if client was closed (HttpClient doesn't strictly need close)
        client = self.client 
        return client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
    
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
        collection = self.get_collection()
        collection.add(
            ids=[doc["id"] for doc in documents],
            embeddings=embeddings,
            documents=texts,
            metadatas=[doc.get("metadata", {}) for doc in documents]
        )
    
    def upsert_documents(self, documents: List[Dict]):
        """
        Update hoặc Insert documents vào ChromaDB.
        Nếu ID đã tồn tại thì UPDATE, nếu chưa có thì INSERT.
        
        documents = [
            {"id": "1", "text": "...", "metadata": {"title": "..."}},
            ...
        ]
        """
        from chatbot.embedding.service.embedding import EmbeddingService
        
        # Reuse singleton instance
        embedding_service = EmbeddingService()
        
        texts = [doc["text"] for doc in documents]
        embeddings = embedding_service.embed_documents(texts)
        
        # Upsert: update nếu ID tồn tại, insert nếu chưa có
        collection = self.get_collection()
        collection.upsert(
            ids=[doc["id"] for doc in documents],
            embeddings=embeddings,
            documents=texts,
            metadatas=[doc.get("metadata", {}) for doc in documents]
        )
    
    def refresh_collection(self):
        """
        Refresh collection để lấy dữ liệu mới nhất từ ChromaDB.
        Với Client-Server mode, dữ liệu luôn consistency nên có thể không cần reload object,
        nhưng vẫn giữ method để đảm bảo behavior.
        """
        # In client-server mode, this is largely a no-op as the server holds state
        pass
    
    def search(self, query: str, n_results: int = 5) -> List[Dict]:
        """Tìm kiếm documents tương tự"""
        from chatbot.embedding.service.embedding import EmbeddingService
        
        # Reuse singleton instance - không tạo mới mỗi lần
        embedding_service = EmbeddingService()
        query_embedding = embedding_service.embed_query(query)
        collection = self.get_collection()
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format kết quả
        retrieved_docs = []
        if results['documents']:
             for i in range(len(results['documents'][0])):
                retrieved_docs.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "score": 1 - results['distances'][0][i]  # Cosine similarity
                })
        
        return retrieved_docs
    
    def delete_all(self):
        """Xóa toàn bộ collection (để rebuild)"""
        client = self.client
        client.delete_collection("knowledge_base")
        self.collection = client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        
    def delete_documents(self, ids: List[str]):
        """
        Xóa documents theo ID từ ChromaDB
        """
        if not ids:
            return
        collection = self.get_collection()
        collection.delete(ids=ids)