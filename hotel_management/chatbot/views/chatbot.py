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

@api_view(["POST"])
def chat_bot_response(request):
    serializer_input = ChatBotRequestSerializer(data=request.data)
    if serializer_input.is_valid():
        input = serializer_input.validated_data['user_input']
        print("CHECK INPUT")
    else:
        return AppResponse.error(ErrorCodes.INVALID_REQUEST,serializer_input.errors)
    
    try:
        result = chat_bot.invoke({"question":input})
        print("CHECK SCORE: ", result['check_score'])
        print("CHECK RETRIEVE: ", result['check'])
        response = {"response":result['response']}
        final_response = ChatBotResponseSerializer(data=response)
        if final_response.is_valid():
            return AppResponse.success(SuccessCodes.AI_CHATBOT_SUCCESS, final_response.data)
        else:
            return AppResponse.error(ErrorCodes.INVALID_REQUEST, final_response.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.INTERNAL_SERVER_ERROR, str(e))
