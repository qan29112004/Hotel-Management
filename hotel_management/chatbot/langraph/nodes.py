import os
import re
import threading
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
from operator import add
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import StrOutputParser
from django.conf import settings
from chatbot.prompt.ai_prompt import chatbot_prompt
from chatbot.embedding.service.embedding import EmbeddingService
from chatbot.embedding.vector.vector_store import VectorStore
import logging
import sys

logging.basicConfig(
    level=logging.INFO,  # mức log bạn muốn: DEBUG, INFO, WARNING...
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)
vectorstore = VectorStore()

# Cache LLM instance - chỉ tạo một lần, reuse cho tất cả requests
# Tiết kiệm thời gian khởi tạo, không tốn thêm RAM vì chỉ có 1 instance
_llm_instance = None
_llm_lock = threading.Lock()

def get_model():
    """Lazy load LLM instance - chỉ tạo một lần duy nhất"""
    global _llm_instance
    if _llm_instance is None:
        with _llm_lock:
            if _llm_instance is None:
                _llm_instance = ChatGroq(
                    groq_api_key=settings.GROQ_API_KEY,
                    model_name="llama-3.1-8b-instant",
                    temperature=0.7,  # Giảm temperature để model follow prompt chặt chẽ hơn, tránh bịa đặt
                    max_tokens=1024
                )
    return _llm_instance

def sanitize_input(state:dict):
    user_input = state['question']
    
    if len(user_input) > 2000:
        user_input = user_input[:2000]

    # Remove ký tự control + script injection
    user_input = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", user_input)
    user_input = re.sub(r"<script.*?>.*?</script>", "", user_input, flags=re.I)
    state['after_sanitize_input'] = user_input
    return state

def retrieve(state:dict):
    state['check']= "chay vao retrieve"
    docs = vectorstore.search(state['after_sanitize_input'], 3)
    state['retrieve_data'] = docs
    return state

def response(state:dict):
    SIMILARITY_THRESHOLD = 0.77
    docs = state['retrieve_data']
    relevant_docs = []
    state['check_score']=[]
    context=''
    for doc in docs:
        logging.info(f'CHECK SCORE: {doc["score"]}')
        sys.stdout.flush()
        if doc["score"] >= SIMILARITY_THRESHOLD:
            state['check_score'].append(doc["score"])
            relevant_docs.append(doc)
        # Dừng sớm nếu đủ (tùy chọn)
        # if len(relevant_docs) >= 2: break

    # XỬ LÝ THEO SỐ LƯỢNG DOC LIÊN QUAN
    if len(relevant_docs) == 0:
        # KHÔNG TÌM THẤY GÌ LIÊN QUAN
        context = ''
        state['response'] = "Xin lỗi bạn, tôi chưa thể đưa ra câu trả lời cho câu hỏi của bạn do tôi không tìm thấy thông tin liên quan hoặc không liên quan đến khách sạn Luskibeck. Nếu bạn vẫn muốn giải đáp thắc mắc cho câu hỏi này thì xin vui lòng click nút nhắn tin với nhân viên."
        return state
    elif len(relevant_docs) < 3:
        # CHỈ CÓ 1-2 DOC → VẪN DÙNG, NHƯNG CẢNH BÁO TRONG PROMPT
        context = "\n\n".join([f"{doc['content']}" for doc in relevant_docs])
        fallback_note = '''
            \n\n**Lưu ý**: Thông tin có thể chưa đầy đủ. 
        '''
        context = context + fallback_note
    else:
        # ĐỦ 3 DOC → TIN CẬY CAO
        context = "\n\n".join([f"{doc['content']}" for doc in relevant_docs])
    
    
    # Reuse cached LLM instance và tạo chain (prompt có thể thay đổi nên không cache chain)
    chain = chatbot_prompt | get_model()
    response = chain.invoke({'context':context, 'question':state['after_sanitize_input']})  
    state['check'] = chatbot_prompt.format(context=context, question=state['after_sanitize_input'])
    state['response'] = response.content
    return state