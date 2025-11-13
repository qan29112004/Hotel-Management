import { inject, Injectable } from '@angular/core';
import { Message } from '../chat.types';
import { Firestore, collection, query, where, getDocs, onSnapshot, addDoc, doc, getDoc, updateDoc, orderBy, Timestamp, deleteField, FieldPath, limit, deleteDoc, collectionData, collectionGroup, startAfter } from '@angular/fire/firestore';
import { catchError, map, Observable, of, Subject } from 'rxjs';
import { ChatUserService } from '../chat-user/chat-user.service';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from 'app/core/uri/config';


@Injectable({
  providedIn: 'root'
})
export class ChatMessageService {

  _messageListeners: Map<number, () => void> = new Map();
  private _messages: Message[];
  private _firestore = inject(Firestore);
  private chatRoomUnsubscribe: (() => void) | null = null;
  messagesChatRoom: Subject<Message[]> = new Subject();
  private _oldestDoc: any;
  private _newestDoc: any;
  isLoadMoreMessage: boolean = true;
  private _realtimeUnsubscribe: (() => void) | null = null;
  isAddNewChat: boolean = false;
  private _chatRoom = 'sessionChats';
  private _chatUserService = inject(ChatUserService);
  private _httpClient = inject(HttpClient);

  constructor() { }
  getAllChatOfChatRoom(chatRoomId: any, isChatWidget: boolean) {
      this._messages = [];
      const messagesRef = collection(
          this._firestore,
          `sessionChats/${chatRoomId}/messages`
      );
      console.log('ID CHAT KHI TRUYEN VAO: ', chatRoomId);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      if (!isChatWidget && this.chatRoomUnsubscribe) {
          console.log('Unsubscribing from previous chat room updates');
          this.chatRoomUnsubscribe();
      }
      this.chatRoomUnsubscribe = onSnapshot(q, (snapshot) => {
          // Lần đầu load toàn bộ tin nhắn
          if (this._messages.length === 0) {
              this._messages = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
              })) as Message[];
              console.log('Initial messages loaded:', this._messages);
              this.messagesChatRoom.next([...this._messages]);
              return;
          }

          snapshot.docChanges().forEach((change) => {
              console.log(
                  'message them moi:',
                  change.type,
                  change.doc.data()
              );

              if (change.type === 'added') {
                  const newMessage = {
                      id: change.doc.id,
                      ...change.doc.data(),
                  } as Message;

                  // Kiểm tra xem message đã tồn tại trong _messages chưa
                  const existingMessage = this._messages.find(
                      (msg) => msg.id === newMessage.id
                  );
                  if (!existingMessage) {
                      this._messages.push(newMessage);
                      this.messagesChatRoom.next([newMessage]);
                  } else {
                      console.log(
                          'Message đã tồn tại trong service, bỏ qua:',
                          newMessage.id
                      );
                  }
              }
          });
      });
  }

  async getLimitChatOfChatRoom(
      chatRoomId: any,
      isChatWidget: boolean,
      pageSize?: number,
      isInitial: boolean = false
  ) {
      const messagesRef = collection(
          this._firestore,
          `sessionChats/${chatRoomId}/messages`
      );
      console.log('ID CHAT KHI TRUYEN VAO: ', chatRoomId);

      // Query cho batch: order desc (mới nhất đầu), limit pageSize
      let q = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          limit(pageSize)
      );
      if (!isInitial && this._oldestDoc) {
          console.log(
              'CO _oldestDoc, sử dụng startAfter: ',
              this._oldestDoc.data()
          );
          q = query(
              messagesRef,
              orderBy('timestamp', 'desc'),
              startAfter(this._oldestDoc),
              limit(pageSize)
          );
      }

      // Load batch với getDocs (không realtime)
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
          console.log('No more messages to load');
          this.isLoadMoreMessage = false;
          this.messagesChatRoom.next([]);
          this.setupRealtimeListener(messagesRef, chatRoomId, isChatWidget);
          return;
      }
      this.isLoadMoreMessage = true;
      // Batch desc: snapshot.docs[0] = newest in batch, docs[last] = oldest in batch
      const batchMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      })) as Message[];
      console.log('Loaded batch messages:', batchMessages);

      // Reverse batch thành asc (oldest đầu) để component dễ add vào đầu chats
      const batchAsc = batchMessages.reverse();

      // Next batch cho component (component sẽ accumulate)
      this.messagesChatRoom.next(batchAsc);

      // Update state
      this._oldestDoc = snapshot.docs[snapshot.docs.length - 1];
      console.log('CO PHAI LA INITIAL KHONG: ', isInitial);
      if (isInitial) {
          this._newestDoc = snapshot.docs[0];
          this.setupRealtimeListener(messagesRef, chatRoomId, isChatWidget);
      }
  }

  private setupRealtimeListener(
      messagesRef: any,
      chatRoomId: string,
      isChatWidget: boolean
  ) {
      console.log('CO CHAY VAO FUNC REAM TIME');
      if (!isChatWidget && this._realtimeUnsubscribe) {
          console.log('Unsubscribing from previous realtime updates');
          this._realtimeUnsubscribe();
      }

      // Query realtime: order asc, startAfter newest initial (chỉ catch tin nhắn mới hơn newest)
      let qRealtime;
      if (this._newestDoc) {
          qRealtime = query(
              messagesRef,
              orderBy('timestamp', 'asc'),
              startAfter(this._newestDoc)
          );
      } else {
          // Chat rỗng, bắt tất cả tin nhắn đầu tiên
          qRealtime = query(messagesRef, orderBy('timestamp', 'asc'));
      }
      console.log('Realtime query:', qRealtime);

      this._realtimeUnsubscribe = onSnapshot(qRealtime, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              console.log(
                  'message them moi:',
                  change.type,
                  change.doc.data()
              );
              this.isAddNewChat = true;
              if (change.type === 'added') {
                  const newMessage = {
                      id: change.doc.id,
                      ...(change.doc.data() as Object),
                  } as Message;
                  this.messagesChatRoom.next([newMessage]);
              }
          });
      });
  } 

  async addMessage(
      chatRoomId: string,
      chatRoomMessage: Message,
      user: any,
      userId?: any
  ) {
      console.log('CHAY HAM ADD MESSAGE TRONG SERVICE');
      console.log(chatRoomMessage);
      const messageRef = collection(
          this._firestore,
          `${this._chatRoom}/${chatRoomId}/messages`
      );
      const docRef = doc(this._firestore, this._chatRoom, chatRoomId);

      const chatroomDoc = await getDoc(docRef);

      await addDoc(messageRef, {
          senderUser: chatRoomMessage.senderUser,
          text: chatRoomMessage.text,
          timestamp: chatRoomMessage.timestamp,
          role: chatRoomMessage.role,
          urlFile: chatRoomMessage.urlFile,
      });

      if (!chatroomDoc.exists()) {
      } else {
          const data = chatroomDoc.data();
          console.log('DATA USER TRONG UPDATE DOC: ', user);
          console.log('CHECK DATA:', data);
          data.lastMessageTimestamp = chatRoomMessage.timestamp;
          data.lastMessage = chatRoomMessage.text
              ? chatRoomMessage.text
              : 'Bạn đã gửi file';
          data.lastUpdate = chatRoomMessage.timestamp;
          data.senderName = user.username;
          await updateDoc(docRef, { ...data });
          //cập nhật timestamp lastmessage cho user doc
          await this._chatUserService.updateUserDoc(
              data.userId,
              user,
              { lastMessageTimestamp: data.lastMessageTimestamp },
              userId
          );
      }
  }

  chatBot(message: string): Observable<string> {
      return this._httpClient
          .post(uriConfig.API_CHATBOT_CHAT, { userMessage: message })
          .pipe(
              map((response: any) => {
                  console.log('RESPONSE CHAT: ', response.data.botResponse);
                  return response.data.botResponse;
              }),
              catchError((error) => {
                  console.error('Error fetching chatbot data:', error);
                  return of('');
              })
          );
  }

  async countTotalMessages(): Promise<number> {
      const messagesRef = collectionGroup(this._firestore, 'messages');
      const snapshot = await getDocs(messagesRef);
      return snapshot.size;
  }

  cleanupMessageListeners() {
      if (this._messageListeners) {
          this._messageListeners.forEach((unsubscribe) => unsubscribe());
          this._messageListeners.clear();
      }
  }

}
