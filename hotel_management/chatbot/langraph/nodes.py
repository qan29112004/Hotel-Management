import os
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
from operator import add
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.schema import StrOutputParser
from django.conf import settings
from chatbot.prompt.ai_prompt import chatbot_prompt

def get_model():
    llm = ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.1-8b-instruct",
        temperature=0.7,
        max_tokens=512
    )
    return llm

def sanitize_input(state:dict):
    user_input = state['question']
    sanitize_prompt = f"""
    Kiểm tra input sau, loại bỏ nội dung không liên quan đến khách sạn/booking:
    "{user_input}"
    
    Sau đó hãy xóa hêt các ký tự control + script injection rồi trả về câu hỏi.
    """
    llm = get_model()
    sanitized = llm.invoke([("system", "Bạn là bộ lọc an toàn."), ("user", sanitize_prompt)])
    state['sanitize_input'] = sanitized.content
    return state

def retrieve_and_response(state:dict):
    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
    vectorstore = Chroma(
        persist_directory=settings.CHROMA_PATH,
        embedding_function=embeddings
    )
    docs = vectorstore.similarity_search(state['sanitize_input'], k=3)
    context = "\n\n".join([f"{doc.page_content}" for doc in docs])
    
    chain = chatbot_prompt | get_model() 
    response = chain.invoke({'context':context, 'question':state['sanitize_input']})
    state['response'] = response.content
    return state