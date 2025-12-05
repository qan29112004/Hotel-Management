from langgraph.graph import StateGraph
from .nodes import retrieve, sanitize_input, response
from .edges import EDGES
from dataclasses import dataclass, field
from typing import List, Tuple

class Document():
    page_content: str
    metadata: dict

class State(dict):
    question:str  # Câu hỏi gốc (có thể có history)
    original_question:str  # Câu hỏi gốc KHÔNG có history - dùng cho vector search
    question_with_history:str  # Câu hỏi có history - dùng cho prompt LLM
    after_sanitize_input:str
    response:str
    retrieve_data:List[Tuple[Document, float]]
    check_score:List[float]
    check:str
    
def build_rag():
    graph = StateGraph(State)
    
    #add node
    graph.add_node("sanitize_input", sanitize_input)
    graph.add_node("retrieve", retrieve)
    graph.add_node("rag", response)
    
    #initialize node
    graph.set_entry_point("sanitize_input")
    
    #flow graph
    # Add edges
    for start, end in EDGES:
        graph.add_edge(start, end)
        
    return graph.compile()


chat_bot = build_rag()