from chatbot.langraph.workflow import chat_bot
from chatbot.serializer import ChatBotRequestSerializer, ChatBotResponseSerializer
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from constants.error_codes import ErrorCodes
from constants.success_codes import SuccessCodes
from libs.response_handle import AppResponse
import asyncio

@api_view(["POST"])
def chat_bot_response(request):
    serializer_input = ChatBotRequestSerializer(data=request.data)
    if serializer_input.is_valid():
        input = serializer_input.validated_data['user_input']
        print("CHECK INPUT")
    else:
        return AppResponse.error(ErrorCodes.INVALID_REQUEST,serializer_input.errors)
    
    try:
        result = chat_bot.invoke({
            "question": input,
            "original_question": input,
            "question_with_history": input
        })
        print("CHECK SCORE: ", result['check_score'])
        response = {"response":result['response']}
        final_response = ChatBotResponseSerializer(data=response)
        if final_response.is_valid():
            return AppResponse.success(SuccessCodes.AI_CHATBOT_SUCCESS, final_response.data)
        else:
            return AppResponse.error(ErrorCodes.INVALID_REQUEST, final_response.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.INTERNAL_SERVER_ERROR, str(e))

async def chat_bot_test_socket(question: str, history: list = None):
    """
    Simple helper for websocket flow.
    - Tách biệt: original_question (không có history) dùng cho vector search
    - question_with_history (có history) dùng cho prompt LLM để có ngữ cảnh
    """
    original_question = question
    #cái này để giữ ngữ cảnh cuộc trò chuyện
    question_with_history = question  
    if history:
        trimmed = history[-6:]
        history_text = "\n".join(
            [f"{h.get('role', 'user')}: {h.get('text', '')}" for h in trimmed]
        )
        question_with_history = (
            f"Cuộc hội thoại trước đó:\n{history_text}\n\n"
            f"Câu hỏi tiếp theo của người dùng: {question}"
        )

    #chỉ truyền câu hỏi chinh để validate
    input_dict = {"user_input": original_question}
    serializer_input = ChatBotRequestSerializer(data=input_dict)
    if serializer_input.is_valid():
        validated_original = serializer_input.validated_data['user_input']
        print("CHECK INPUT - Original:", validated_original)
    else:
        return serializer_input.errors
    
    try:
        # truyền cả câu hỏi và ngữ cahr vào state
        result = chat_bot.invoke({
            "question": validated_original,  # Dùng cho vector search
            "original_question": validated_original,  # Câu hỏi gốc không có history
            "question_with_history": question_with_history  # Câu hỏi có history cho prompt
        })
        print("check history: ",question_with_history )
        print("CHECK SCORE: ", result['check_score'])
        response = {"response":result['response']}
        final_response = ChatBotResponseSerializer(data=response)
        if final_response.is_valid():
            return final_response.data['response']
        else:
            return final_response.errors
    except Exception as e:
        return str(e)
