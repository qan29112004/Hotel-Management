from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        
        self.user = self.scope.get("user")
        if(self.user.role == 2):
            self.room_group_name = "receptionist"
        elif (self.user.role == 3):
            self.room_group_name = self.user.username
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("CHECK TEXT DATA:",type(data))
        print("CHECK USER:",self.user.role)
        # Gửi lại message user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "role": str(self.user.role),
                "text": data.get('text', '')
            }
        )


        # Gửi lại message AI
        if(self.user.role != 2):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "role": "1",
                    "text": data.get('text', '')
                }
            )

    async def chat_message(self, event):
        from chatbot.views.chatbot import chat_bot_test_socket
        if(event['role']=='1'):
            text = await chat_bot_test_socket(event['text'])
        else:text = event['text']
        
        await self.send(text_data=json.dumps({
            "role": event["role"],
            "text": text,
            "timestamp":1700046000
        }))