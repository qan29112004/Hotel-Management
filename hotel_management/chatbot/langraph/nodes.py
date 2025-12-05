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
    level=logging.INFO,  
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)
vectorstore = VectorStore()
#chỉ có 1 instance xuyên suốt dự án
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
                    model_name="llama-3.3-70b-versatile",
                    temperature=0.5,  # Giảm temperature để model follow prompt chặt chẽ hơn, tránh bịa đặt
                    max_tokens=1024
                )
    return _llm_instance

def sanitize_input(state:dict):
    # Lấy original_question nếu có, nếu không thì dùng question
    user_input = state.get('original_question', state.get('question', ''))
    
    if len(user_input) > 2000:
        user_input = user_input[:2000]

    # Remove ký tự control + script injection
    user_input = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", user_input)
    user_input = re.sub(r"<script.*?>.*?</script>", "", user_input, flags=re.I)
    state['after_sanitize_input'] = user_input
    
    # Đảm bảo original_question được set
    if 'original_question' not in state:
        state['original_question'] = user_input
    
    # Đảm bảo question_with_history được set (mặc định = original_question nếu không có)
    if 'question_with_history' not in state:
        state['question_with_history'] = user_input
    
    return state

def retrieve(state:dict):
    state['check']= "chay vao retrieve"
    #chỉ search câu hỏi của user truỳne vao
    search_query = state.get('original_question', state['after_sanitize_input'])
    docs = vectorstore.search(search_query, 3)
    state['retrieve_data'] = docs
    return state

def response(state:dict):
    SIMILARITY_THRESHOLD = 0.75  # Threshold để filter documents liên quan
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

    
    if len(relevant_docs) == 0:
        # khong co gi lien quan, huy call model
        context = ''
        state['response'] = "Xin lỗi bạn, tôi chưa thể đưa ra câu trả lời cho câu hỏi của bạn do tôi không tìm thấy thông tin liên quan hoặc không liên quan đến khách sạn Luskibeck. Nếu bạn vẫn muốn giải đáp thắc mắc cho câu hỏi này thì xin vui lòng click nút nhắn tin với nhân viên."
        return state
    elif len(relevant_docs) < 3:
        
        min_score = min([doc["score"] for doc in relevant_docs])
        if min_score < 0.80:  # Nếu score thấp hơn 0.80, cảnh báo trong prompt
            context = "\n\n".join([f"{doc['content']}" for doc in relevant_docs])
            fallback_note = '''

⚠️ **CẢNH BÁO NGHIÊM NGẶT**: Thông tin trên có thể KHÔNG hoàn toàn liên quan đến câu hỏi. Nếu bạn không chắc chắn về thông tin này, hãy chỉ trả lời dựa trên những gì bạn chắc chắn từ context, hoặc nói rằng bạn chưa có thông tin đầy đủ. TUYỆT ĐỐI KHÔNG được bịa đặt hay suy luận thông tin không có trong context.
            '''
            context = context + fallback_note
        else:
            context = "\n\n".join([f"{doc['content']}" for doc in relevant_docs])
    else:
        # muc do tin cay cao
        context = "\n\n".join([f"{doc['content']}" for doc in relevant_docs])
    
    #lay ngu cảnh ra truyền vào prompt, nếu không thi chỉ lấy câu hỏi
    question_for_prompt = state.get('question_with_history', state['after_sanitize_input'])
    
    # Reuse cached LLM instance và tạo chain (prompt có thể thay đổi nên không cache chain)
    chain = chatbot_prompt | get_model()
    response = chain.invoke({'context':context, 'question':question_for_prompt})  
    state['check'] = chatbot_prompt.format(context=context, question=question_for_prompt)
    state['response'] = response.content
    return state