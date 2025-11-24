from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from chatbot.models import *

class KnowlegdeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model=KnowlegdeBaseModel
        fields='__all__'
        
class ChatBotRequestSerializer(serializers.Serializer):
    user_input = serializers.CharField()
    
class ChatBotResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    
class MessageSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    timestamp = serializers.IntegerField(source='created_at')
    class Meta:
        model=Message
        fields=['uuid', 'text', 'role', 'timestamp']
        
    def get_role(self,obj):
        return str(obj.sender)
    
class RequirementSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    class Meta:
        model=GroupChat
        fields=['uuid','name','status','user']
        
    def get_user(self,obj):
        user = obj.group_member.filter(user__role=3).first().user
        return {
            "id":user.id,
            "email":user.email,
            "phone":user.phone,
            "avatar":user.avatar
        }
        