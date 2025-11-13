from langgraph.graph import StateGraph
from .nodes import retrieve_and_response, sanitize_input
from .edges import EDGES


class State(dict):
    question:str
    sanitize_input:str
    response:str
    
def build_rag():
    graph = StateGraph(State)
    
    #add node
    graph.add_node("sanitize_input", sanitize_input)
    graph.add_node("rag", retrieve_and_response)
    
    #initialize node
    graph.set_entry_point("sanitize_input")
    
    #flow graph
    # Add edges
    for start, end in EDGES:
        graph.add_edge(start, end)
        
    return graph.compile()


chat_bot = build_rag()