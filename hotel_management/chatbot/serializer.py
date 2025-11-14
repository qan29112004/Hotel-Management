from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from chatbot.models import KnowlegdeBaseModel

class KnowlegdeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model=KnowlegdeBaseModel
        fields='__all__'
        
class ChatBotRequestSerializer(serializers.Serializer):
    user_input = serializers.CharField()
    
class ChatBotResponseSerializer(serializers.Serializer):
    response = serializers.CharField()