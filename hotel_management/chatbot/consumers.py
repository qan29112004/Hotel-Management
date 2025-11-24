from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async
import asyncio


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from chatbot.models import GroupChat, GroupMember
        self.user = self.scope.get("user")
        self.groups_to_join = []
        print(f"[CONNECT] User: {self.user} - Channel: {self.channel_name}")
        if self.user.role == 2:  # receptionist
            await self.channel_layer.group_add("receptionist", self.channel_name)

            # Lấy danh sách group mà receptionist đã join trong DB
            groups = await sync_to_async(list)(
                GroupMember.objects.filter(user=self.user).values_list("group__uuid", flat=True)
            )
            
            is_join:bool = True
            if len(groups)==0:
                is_join = False
            else:
                for g in groups:
                    self.groups_to_join.append(g)
            await self.channel_layer.group_send(
                'receptionist',
                {
                    "type": "notify_recept_is_join",
                    "is_join": is_join
                }
            )

        elif self.user.role == 3:  # user
            group_chat,_ = await sync_to_async(GroupChat.objects.get_or_create)(name=self.user.username)
            user_group,_ = await sync_to_async(GroupMember.objects.get_or_create)(user=self.user, group=group_chat)
            group_uuid = await sync_to_async(lambda ug: ug.group.uuid)(user_group)
            self.groups_to_join.append(group_uuid)
            

        # Join tất cả group
        for group_name in self.groups_to_join:
            await self.channel_layer.group_add(group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('receptionist', self.channel_name)
        for group_name in self.groups_to_join:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive(self, text_data):
        from chatbot.models import GroupMember, GroupChat, ReceptionistJoinedGroup, Message
        from chatbot.views.chatbot import chat_bot_test_socket
        data = json.loads(text_data)
        print("CHECK TEXT DATA:",type(data))
        print("CHECK USER:",self.user.role)
        # Gửi lại message user
        
        if(data.get('action') =='send_message'):
            group_chat = await sync_to_async(GroupChat.objects.get)(uuid=data.get('group_name'))
            user_message = await sync_to_async(Message.objects.create)(
                group=group_chat, text=data.get('text', ''), sender=str(self.user.role)
            )
            await self.channel_layer.group_send(
                data.get('group_name'),
                {
                    "type": "chat_message",
                    "role": str(self.user.role),
                    "text": data.get('text', ''),
                    "timestamp": user_message.created_at,
                    "group": data.get('group_name')
                }
            )
            
        if(data.get('action') =='send_message_ai'):
            group_chat = await sync_to_async(GroupChat.objects.get)(uuid=data.get('group_name'))
            user_message = await sync_to_async(Message.objects.create)(
                group=group_chat, text=data.get('text', ''), sender=str(self.user.role)
            )
            await self.send(text_data=json.dumps({
                'action': "send_message",
                "role": str(self.user.role),
                "text": data.get('text', ''),
                "timestamp": user_message.created_at,
                'group': data.get('group_name')
            }))

            # 2️⃣ Gọi AI reply chạy background, không await
            async def ai_reply():
                ai_text = await chat_bot_test_socket(data.get('text', ''))
                ai_message = await sync_to_async(Message.objects.create)(
                    group=group_chat,
                    text=ai_text,
                    sender='1'
                )
                await self.channel_layer.group_send(
                    data.get('group_name'),
                    {
                        "type": "chat_message",
                        "role": "1",
                        "text": ai_text,
                        "timestamp": ai_message.created_at,
                        "group": data.get('group_name')
                    }
                )
            await asyncio.sleep(0.4)
            asyncio.create_task(ai_reply())
        if(data.get('action')=="send_requirement"):
            group_member = await sync_to_async(GroupMember.objects.get)(user=self.user, group__uuid=data.get('group_name'))
            group = await sync_to_async(lambda ug: ug.group)(group_member)
            group.status = 'Waiting'
            await sync_to_async(group.save)()
            await self.channel_layer.group_send(
                'receptionist',
                {
                    "type": "send_requirement",
                    "uuid": str(group.uuid),
                    'name':group.name,
                    "action": 'send_requirement',
                    'status':group.status,
                    'user':{
                        "id":self.user.id,
                        'email':self.user.email,
                        'phone':self.user.phone,
                        'avatar':self.user.avatar
                    }
                }
            )
            await self.send(text_data=json.dumps({
                "action":'send_requirement',
                'group_status':group.status,
                'group':group.uuid
            }))
            
        if(data.get('action')=="join_group"):
            await self.channel_layer.group_add(data.get('group_name'), self.channel_name)
            group_chat = await sync_to_async(GroupChat.objects.get)(uuid = data.get('group_name'))
            group_chat.status = 'In progress'
            await sync_to_async(group_chat.save)()
            member,_=await sync_to_async(GroupMember.objects.get_or_create)(user=self.user, group=group_chat)
            check = await sync_to_async(ReceptionistJoinedGroup.objects.create)(receptionist=self.user, group = group_chat)
            group_uuid = await sync_to_async(lambda obj: str(obj.group.uuid))(check)
            await self.channel_layer.group_send(
                data.get('group_name'),
                {
                    "type": "noti_join_group_to_user",
                    "group": group_uuid,
                    "group_status":group_chat.status,
                    "action": 'join_group',
                }
            )
            await self.channel_layer.group_send(
                'receptionist',
                {
                    "type": "join_group",
                    "group": group_uuid,
                    'group_status':group_chat.status,
                    "action": 'join_group',
                    'status':'success' if check and check.status =='In progress' else 'error'
                }
            )
            
        if(data.get('action')=="out_group"):
            await self.channel_layer.group_discard(data.get('group_name'), self.channel_name)
            group_chat = await sync_to_async(GroupChat.objects.get)(uuid = data.get('group_name'))
            group_chat.status = 'Normal'
            await sync_to_async(group_chat.save)()
            member = await sync_to_async(GroupMember.objects.get)(user=self.user, group__uuid=data.get('group_name'))
            await sync_to_async(member.delete)()
            check = await sync_to_async(ReceptionistJoinedGroup.objects.get)(receptionist=self.user, group=group_chat, status='In progress')
            check.status = "Solved"
            group_uuid = await sync_to_async(lambda obj: str(obj.group.uuid))(check)
            await sync_to_async(check.save)()
            await self.channel_layer.group_send(
                data.get('group_name'),
                {
                    "type": "noti_group_to_user",
                    "group": group_uuid,
                    "group_status":group_chat.status,
                    "action": 'out_group',
                }
            )
            await self.channel_layer.group_send(
                "receptionist",
                {
                    "type": "out_group",
                    "group": group_uuid,
                    "group_status":group_chat.status,
                    "action": 'out_group',
                    'status':'success' if check and check.status =='Solved' else 'error'
                }
            )

        # Gửi lại message AI
        # if(data.get('action')=='send_message_ai'):
        #     async def ai_reply():
        #         ai_text = await chat_bot_test_socket(data.get('text', ''))
        #         ai_message = await sync_to_async(Message.objects.create)(
        #             group=group_chat,
        #             text=ai_text,
        #             sender='1'
        #         )
        #         await self.channel_layer.group_send(
        #             data.get('group_name'),
        #             {
        #                 "type": "chat_message",
        #                 "role": "1",
        #                 "text": ai_text,
        #                 "timestamp": ai_message.created_at,
        #                 "group": data.get('group_name')
        #             }
        #         )

        #     # Không chặn receive
        #     await asyncio.sleep(0.2) 
        #     asyncio.create_task(ai_reply())
        #     text = await chat_bot_test_socket(data.get('text', ''))
        #     group_chat = await sync_to_async(GroupChat.objects.get)(uuid = data.get('group_name'))
        #     new_message = await sync_to_async(Message.objects.create)(group=group_chat, text=text, sender='1')
        #     await self.channel_layer.group_send(
        #         data.get('group_name'),
        #         {
        #             "type": "chat_message",
        #             "role": "1",
        #             "text": text,
        #             'timestamp':new_message.created_at,
        #             'group': data.get('group_name')
        #         }
        #     )
    
    async def chat_message(self, event):
        from chatbot.views.chatbot import chat_bot_test_socket
        from chatbot.models import GroupChat, Message
        print(f"[chat_message] Channel: {self.channel_name} | Group: {event['group']} | Text: {event['text']}")
        
        
        print("chay luu message")
        await self.send(text_data=json.dumps({
            'action':"send_message",
            "role": event["role"],
            "text": event['text'],
            "timestamp":event["timestamp"]
        }))
        
    async def join_group(self, event):
        await self.send(text_data=json.dumps({
            "group": event['group'],
            "action": event['action'],
            'status':event['status']
        }))
    async def out_group(self, event):
        await self.send(text_data=json.dumps({
            "group": event['group'],
            "action": event['action'],
            'status':event['status']
        }))
    
    async def notify_recept_is_join(self, event):
        await self.send(text_data=json.dumps({
            'action':'check',
            'is_join':event['is_join']
        }))
        
    async def send_requirement(self, event):
        await self.send(text_data=json.dumps({
            'action': event['action'],
            'data':{
                "uuid": event['uuid'],
                'name':event['name'],
                'status':event['status'],
                'user':event['user']
            }
        }))
    async def noti_group_to_user(self, event):
        await self.send(text_data=json.dumps({
            'action':'noti_out_group',
            'group_status':event['group_status'],
            'group':event['group']
        }))
    async def noti_join_group_to_user(self, event):
        await self.send(text_data=json.dumps({
            'action':'noti_join_group',
            'group_status':event['group_status'],
            'group':event['group']
        }))