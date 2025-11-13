import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, onSnapshot, addDoc, doc, getDoc, updateDoc, orderBy, Timestamp, deleteField, FieldPath, limit, deleteDoc, collectionData, collectionGroup, startAfter } from '@angular/fire/firestore';
import { UserService } from 'app/core/profile/user/user.service';
import { ChatRoom, Message } from '../chat.types';
import { catchError, from, map, Observable, of, Subject, switchMap, tap, throwError } from 'rxjs';
import { ChatUserService } from '../chat-user/chat-user.service';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class ChatChatroomService {

  constructor() { }
  private _firestore = inject(Firestore);
  private _userService = inject(UserService);
  private _chatRoom = 'sessionChats';
  private chatRoomUnsubscribe: (() => void) | null = null;
  private _chatUserService = inject(ChatUserService);
  sessionChatSubject: Subject<any[]> = new Subject();
  chatRoomSubject: Subject<ChatRoom> = new Subject();
  private _router = inject(Router);
  adminData:any;
  lastChatRoom: Subject<ChatRoom> = new Subject();

  getAllSessionChats() {
    const collectionRef = collection(this._firestore, this._chatRoom);
    this._userService.user$
      .subscribe((user) => {
          let q;
          if (user.role === 1) {
              q = collectionRef;
          } else {
              q = query(collectionRef, where('userId', '==', user.id));
          }
          let sessionChats: any[] = [];
          if (this.chatRoomUnsubscribe) {
              console.log(
                  'Unsubscribing from previous chat room updates'
              );
              this.chatRoomUnsubscribe();
          }

          return onSnapshot(q, (snapShot) => {
              sessionChats = snapShot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
              }));
              this.sessionChatSubject.next(sessionChats);
              snapShot.docChanges().forEach((change) => {
                  if (change.type === 'removed') {
                      const deletedSessionChat = {
                          id: change.doc.id,
                          ...change.doc.data(),
                      } as Message;
                      sessionChats = sessionChats.filter(
                          (item) => item.id !== change.doc.id
                      );
                      if (
                          localStorage.getItem('idChatWidget') ===
                          change.doc.id
                      ) {
                          localStorage.removeItem('idChatWidget');
                      }
                      this.sessionChatSubject.next(sessionChats);
                  }
              });
          });
      })
      .unsubscribe();
  }
  async UpdateChatRoom(chatRoomId: string, username: string) {
      const docRef = doc(this._firestore, this._chatRoom, chatRoomId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
          const data = docSnap.data() as ChatRoom;
          data.userAccess[username] = Timestamp.now();
          await updateDoc(docRef, { userAccess: data.userAccess });
          console.log('Chat room updated successfully');
      } else {
          console.log('No such document!');
      }
  }

  async getChatRoom(
      chatRoomId: string,
      username: string,
      isChatWidget: boolean
  ) {
      console.log('Hàm getChatRoom');
      console.log('CHAT ROOM ID:', chatRoomId);
      console.log('USERNAME: ', username);

      const docRef = doc(this._firestore, this._chatRoom, chatRoomId);
      const docSnap = await getDoc(docRef);

      // Kiểm tra document có tồn tại và có dữ liệu không
      if (!docSnap.exists()) {
          console.error('Chat room document does not exist:', chatRoomId);
          return;
      }

      const docData = docSnap.data();
      if (!docData) {
          console.error('Chat room document has no data:', chatRoomId);
          return;
      }

      console.log('Full document data:', docData);
      console.log('userAccess object:', docData.userAccess);
      console.log('userAccess type:', typeof docData.userAccess);
      console.log('Key to delete:', username);

      // Kiểm tra userAccess có tồn tại không
      if (docData.userAccess && typeof docData.userAccess === 'object') {
          let userAccess = docData.userAccess;
          console.log('Current userAccess keys:', Object.keys(userAccess));
          console.log(
              'Username exists in userAccess:',
              username in userAccess
          );

          let userAccessCopy = { ...userAccess };
          delete userAccessCopy[username];
          console.log('Updated userAccess:', userAccessCopy);

          await updateDoc(docRef, { userAccess: userAccessCopy });
      } else {
          console.warn(
              'userAccess is not available or invalid:',
              docData.userAccess
          );
          // Tạo userAccess mới nếu không có
          const newUserAccess = { [username]: Timestamp.now() };
          console.log('Creating new userAccess:', newUserAccess);
          await updateDoc(docRef, { userAccess: newUserAccess });
      }

      if (!isChatWidget && this.chatRoomUnsubscribe) {
          console.log('Unsubscribing from previous chat room updates');
          this.chatRoomUnsubscribe();
      }

      this.chatRoomUnsubscribe = onSnapshot(docRef, (docSnap) => {
          if (!docSnap.exists()) {
              return;
          }
          console.log('USER INFOR: ', this._userService.user);
          const data = {
              ...docSnap.data(),
              chatRoomId: docSnap.id,
          } as ChatRoom;
          console.log('TEST CHAT ROOM INFOR: ', data);
          this.chatRoomSubject.next(data);
      });
  }

  getChatRoomIdByUserId(userId?: string): Observable<string | null> {
      console.log('CHAY HAM GET CHAT ROOM BY ID');
      console.log('USER ID TRONG HAM:', userId);
      const sessionChatsCollection = collection(
          this._firestore,
          'sessionChats'
      );
      const q = query(
          sessionChatsCollection,
          where('userFBId', '==', userId)
      );

      // Sử dụng onSnapshot để liên tục query cho đến khi có kết quả
      return new Observable<string | null>((observer) => {
          const unsubscribe = onSnapshot(
              q,
              (querySnapshot) => {
                  if (!querySnapshot.empty) {
                      const chatRoomId = querySnapshot.docs[0].id;
                      console.log('Found chat room ID:', chatRoomId);
                      observer.next(chatRoomId);
                      observer.complete();
                      unsubscribe(); // Dừng listening sau khi tìm thấy
                  }
                  // Nếu chưa có kết quả, tiếp tục listening (không emit gì)
              },
              (error) => {
                  console.error('Error fetching chat room by userId:', error);
                  observer.error(error);
                  unsubscribe();
              }
          );

          return () => unsubscribe();
      });
  }
  async deleteSessionChatDoc(chatId: any) {
      const chatDoc = doc(this._firestore, this._chatRoom, chatId);
      await deleteDoc(chatDoc);
  }

  createNewSessionChat(
      user: any,
      isNavigateToNewChat: boolean
  ): Observable<string> {
      console.log('CREATE CHAY HAM NAY');
      const userCollectionRef = collection(this._firestore, 'users');

      const qUser = query(
          userCollectionRef,
          where('userId', '==', user.id),
          where('username', '==', user.username)
      );

      return from(getDocs(qUser)).pipe(
          switchMap((userSnapshot) => {
              if (userSnapshot.empty) {
                  throw new Error('User not found in Firestore');
              }

              const userDoc = userSnapshot.docs[0];
              const firebaseUserId = userDoc.id;

              const sessionChatsCollection = collection(
                  this._firestore,
                  this._chatRoom
              );
              const qSession = query(
                  sessionChatsCollection,
                  where('userFBId', '==', firebaseUserId)
              );

              return from(getDocs(qSession)).pipe(
                  switchMap((sessionSnapshot) => {
                      if (!sessionSnapshot.empty) {
                          const existingDoc = sessionSnapshot.docs[0];
                          if (isNavigateToNewChat) {
                              this._router.navigate([
                                  '/chat',
                                  existingDoc.id,
                              ]);
                          }
                          return of(existingDoc.id);
                      }

                      return this._chatUserService.getAdminInfor().pipe(
                          switchMap((adminList) => {
                              if (!adminList || adminList.length === 0) {
                                  throw new Error(
                                      'No admin document found in admin collection'
                                  );
                              }

                              this.adminData = adminList[0];
                              const now = new Date();
                              const formattedDateTime = now.toLocaleString(
                                  'vi-VN',
                                  {
                                      timeZone: 'Asia/Ho_Chi_Minh',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                  }
                              );

                              return from(
                                  addDoc(sessionChatsCollection, {
                                      userFBId: firebaseUserId,
                                      userId: user.id,
                                      adminId: this.adminData.id,
                                      title: 'New Chat',
                                      createdAt: now,
                                      lastUpdate: formattedDateTime,
                                      userAccess: {
                                          [this.adminData.username]:
                                              Timestamp.now(),
                                          [user.username]: Timestamp.now(), // Thêm userAccess cho user hiện tại
                                      },
                                  })
                              ).pipe(
                                  tap((docRef) => {
                                      console.log('New session chat created');
                                      if (isNavigateToNewChat) {
                                          this._router.navigate([
                                              '/chat',
                                              docRef.id,
                                          ]);
                                      }
                                  }),
                                  map((docRef) => docRef.id)
                              );
                          })
                      );
                  })
              );
          }),
          catchError((error) => {
              console.error('Error in createNewSessionChat:', error);
              return throwError(() => error);
          })
      );
  }

  getLastCreatedAtChatRoom(userId: any) {
      if (!userId) {
          console.error('KHONG CO USER ID');
          return;
      }
      if (this.chatRoomUnsubscribe) {
          console.log('Unsubscribing from previous last chat room updates');
          this.chatRoomUnsubscribe();
      }

      const docRef = collection(this._firestore, this._chatRoom);
      const q = query(
          docRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(1)
      );

      this.chatRoomUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
              if (snapshot.empty) {
                  console.log('KHONG CO CHAT ROOM:', userId);
                  this.lastChatRoom.next(null);
                  return;
              }
              const doc = snapshot.docs[0];
              const data = { ...doc.data(), chatRoomId: doc.id } as ChatRoom;
              console.log('Last chat room found:', data);
              this.lastChatRoom.next(data);
          },
          (error) => {
              console.error('Error fetching last created chat room:', error);
              if (error.code === 'failed-precondition') {
                  console.error(
                      'This query requires a composite index. Please check Firebase Console.'
                  );
              }
              this.lastChatRoom.next(null);
          }
      );
  }
}
