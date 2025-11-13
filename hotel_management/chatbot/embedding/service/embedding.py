from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    """Dùng sentence-transformers để tạo embeddings"""
    
    def __init__(self):
        # Dùng model multilingual nhẹ, support đa ngôn ngữ
        self.model = SentenceTransformer('intfloat/multilingual-e5-base')
        # Hoặc: 'paraphrase-multilingual-MiniLM-L12-v2'
    
    def embed_text(self, text: str) -> list:
        """Chuyển text thành vector"""
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    
    def embed_batch(self, texts: list) -> list:
        """Nhúng nhiều texts cùng lúc"""
        embeddings = self.model.encode(
            texts, 
            normalize_embeddings=True,
            show_progress_bar=True
        )
        return embeddings.tolist()