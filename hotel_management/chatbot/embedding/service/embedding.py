from sentence_transformers import SentenceTransformer
import numpy as np
import threading

class EmbeddingService:
    """Dùng sentence-transformers để tạo embeddings với Singleton pattern"""
    
    _instance = None
    _lock = threading.Lock()
    _model = None
    
    def __new__(cls):
        """Singleton pattern - chỉ tạo một instance duy nhất"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Lazy loading - chỉ load model khi cần và chưa load"""
        # Kiểm tra class variable thay vì instance variable
        if EmbeddingService._model is None:
            with self._lock:
                if EmbeddingService._model is None:
                    # Dùng model multilingual nhẹ, support đa ngôn ngữ
                    # Load model một lần duy nhất - tiết kiệm thời gian và RAM
                    model = SentenceTransformer(
                        'intfloat/multilingual-e5-base',
                        cache_folder="/tmp/hf_cache"
                    )
                    EmbeddingService._model = model
        # Gán instance variable để truy cập dễ dàng
        self._model = EmbeddingService._model
    
    @property
    def model(self):
        """Get model instance - đảm bảo model đã được load"""
        if EmbeddingService._model is None:
            self.__init__()
        return EmbeddingService._model
    
    def embed_query(self, text: str) -> list:
        """Chuyển text thành vector"""
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    
    def embed_documents(self, texts: list) -> list:
        """Nhúng nhiều texts cùng lúc"""
        embeddings = self.model.encode(
            texts, 
            normalize_embeddings=True,
            show_progress_bar=False  # Tắt progress bar để giảm I/O overhead
        )
        return embeddings.tolist()