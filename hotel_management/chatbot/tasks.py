import os
from celery import shared_task
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions
from chatbot.models import KnowlegdeBaseModel
from django.conf import settings
from chatbot.embedding.service.embedding import EmbeddingService
from chatbot.embedding.vector.vector_store import VectorStore

@shared_task
def embed_pending_data(uuid):
    """
    Embed các documents có is_embedded=False vào ChromaDB.
    Sử dụng upsert để tự động UPDATE nếu ID đã tồn tại (khi user edit),
    hoặc INSERT nếu là document mới.
    """
    embedded_service = EmbeddingService()
    vector_store = VectorStore()
    
    # Get pending documents (is_embedded=False)
    pending = KnowlegdeBaseModel.objects.filter(uuid=uuid)
    
    for doc in pending:
        text = f"{doc.title}: {doc.content}"
        doc_param = [{
            "id": f"{doc.uuid}",
            "text": f"{doc.title}: {doc.content}",
            "metadata": {"title": f"{doc.title}"}
        }]
        
        # 🔄 Dùng upsert thay vì add để handle cả INSERT và UPDATE
        vector_store.upsert_documents(doc_param)
        
        # Mark as embedded
        doc.is_embedded = True
        doc.save()
    
    return f"Embedded {len(pending)} docs"

@shared_task
def delete_embedded_data(id):
    vector_store = VectorStore()
    list_ids = []
    list_ids.append(id)
    vector_store.delete_documents(list_ids)