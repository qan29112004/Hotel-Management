from langgraph.graph import END

# Edges chỉ là quan hệ node -> node
EDGES = [
    ("sanitize_input", "retrieve"),
    ("retrieve", "rag"),
    ("rag", END),
]