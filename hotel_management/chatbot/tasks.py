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
def embed_pending_data():
    # Load embedder
    # embedder = SentenceTransformer('intfloat/multilingual-e5-base')
    embedded_service = EmbeddingService()
    
    # Chroma client
    # client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    # collection = client.get_or_create_collection(name='knowledge_base')
    vector_store = VectorStore()
    
    # Get pending
    pending = KnowlegdeBaseModel.objects.filter(is_embedded=False)
    for doc in pending:
        text = f"{doc.title}: {doc.content}"
        doc_param = [{
            "id":f"{doc.uuid}",
            "text":f"{doc.title}: {doc.content}",
            "metadata":{"title":f"{doc.title}"}
        }]
        vector_store.add_documents(doc_param)
        doc.is_embedded = True
        doc.save()
    
    return f"Embedded {len(pending)} docs"