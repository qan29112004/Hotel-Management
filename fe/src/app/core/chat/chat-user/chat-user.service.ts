import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, onSnapshot, addDoc, doc, getDoc, updateDoc, orderBy, Timestamp, deleteField, FieldPath, limit, deleteDoc, collectionData, collectionGroup, startAfter } from '@angular/fire/firestore';
import { User } from 'app/core/profile/user/user.types';
import { chunkArray } from 'app/shared/utils/chat/chunk_array.util';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { Message } from '../chat.types';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from 'app/core/uri/config';


@Injectable({
  providedIn: 'root'
})
export class ChatUserService {
  private _firestore = inject(Firestore);
  userSubjects: BehaviorSubject<any[]> = new BehaviorSubject([]);
  private _translocoService = inject(TranslocoService);
  user: any;
  private _chatRoom = 'sessionChats';
  private _httpClient = inject(HttpClient);
  adminData: any;

  constructor() { }
  async createDocumentUser(user: any) {
    try {
        const userCollection = collection(
            this._firestore,
            user.role === 3 ? 'users' : user.role === 2 ? 'staff' : 'admin'
        );
        const queryCollection = query(
            userCollection,
            where('userId', '==', user.id),
            where('username', '==', user.username)
        );
        const userDocs = await getDocs(queryCollection);
        console.log('USER CREATE AT: ', user.createdAt);
        if (userDocs.empty) {
            await addDoc(userCollection, {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                avata: user.avatar,
                createdAt: new Date(),
            });
            console.log('Add doc successfully');
        }
    } catch (error) {
        console.log('Error when add doc:', error);
    }
  }

  getAllUsers(listUserFromDb?: User[]) {
    const collectionRef = collection(this._firestore, 'users');
    const unsubscribeFunctions: (() => void)[] = [];

    const chunkedUsers = chunkArray(listUserFromDb, 30);
    let allUsers: any[] = this.userSubjects.value || [];

    chunkedUsers.forEach((chunk) => {
        const usernames = chunk.map((user) => user.username);
        const q = query(collectionRef, where('username', 'in', usernames));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            // Xử lý dữ liệu từ snapshot của lô hiện tại
            const userDatas = await Promise.all(
                snapshot.docs.map(async (userDoc) => {
                    const lastMessage = await this.getLastMessageForUser(
                        userDoc.id
                    );
                    const fullName = chunk.find(
                        (user) => user.username === userDoc.data().username
                    )?.fullName;
                    return {
                        id: userDoc.id,
                        ...userDoc.data(),
                        fullName: fullName || '',
                        chatRoomId: lastMessage?.chatRoomId,
                        lastMessage: lastMessage?.text
                            ? lastMessage.text
                            : lastMessage?.urlFile
                            ? this._translocoService.translate(
                                  'chat.send_image'
                              )
                            : '',
                        lastMessageTimestamp:
                            lastMessage?.timestamp || null,
                        userAccess: lastMessage?.userAccess,
                        unread: lastMessage?.userAccess[this.user.username] && lastMessage?.userAccess[this.user.username] < lastMessage?.timestamp ? true : false
                    };
                })
            );

            // Cập nhật allUsers với dữ liệu từ lô hiện tại
            userDatas.forEach((userData) => {
                const index = allUsers.findIndex(
                    (user) => user.id === userData.id
                );
                if (index >= 0) {
                    allUsers[index] = userData;
                } else {
                    allUsers.push(userData);
                }
            });

            // Xử lý thay đổi (added, modified, removed)
            const changedUsers = await Promise.all(
                snapshot.docChanges().map(async (change) => {
                    if (
                        change.type === 'modified' ||
                        change.type === 'added'
                    ) {
                        const lastMessage =
                            await this.getLastMessageForUser(change.doc.id);
                        const fullName = chunk.find(
                            (user) => user.username === change.doc.data().username
                        )?.fullName;
                        return {
                            id: change.doc.id,
                            ...change.doc.data(),
                            fullName: fullName || '',
                            chatRoomId: lastMessage?.chatRoomId,
                            lastMessage: lastMessage?.text
                                ? lastMessage.text
                                : lastMessage?.urlFile
                                ? this._translocoService.translate(
                                      'chat.send_image'
                                  )
                                : '',
                            lastMessageTimestamp:
                                lastMessage?.timestamp || null,
                            userAccess: lastMessage?.userAccess,
                            unread: lastMessage?.userAccess[this.user.username] && lastMessage?.userAccess[this.user.username] < lastMessage?.timestamp ? true : false    
                        };
                    } else if (change.type === 'removed') {
                        return { id: change.doc.id, removed: true };
                    }
                    return null;
                })
            );

            changedUsers.forEach((changedUser) => {
                if (!changedUser) return;
                if (changedUser.removed) {
                    allUsers = allUsers.filter(
                        (user) => user.id !== changedUser.id
                    );
                } else {
                    const index = allUsers.findIndex(
                        (user) => user.id === changedUser.id
                    );
                    if (index >= 0) {
                        allUsers[index] = changedUser;
                    } else {
                        allUsers.push(changedUser);
                    }
                }
            });

            // Chỉ phát ra một lần sau khi xử lý toàn bộ lô
            this.userSubjects.next([...allUsers]);
        });
        unsubscribeFunctions.push(unsubscribe);
    });
    const chatsCollection = collection(this._firestore, this._chatRoom);
    const unsubChatRoom = onSnapshot(chatsCollection, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if(change.type === 'modified'){
                console.log("CHAT ROOM MODIFIED")
                const data = change.doc.data();
                const chatRoomId = change.doc.id;
                const index = allUsers.findIndex(user => user.chatRoomId === chatRoomId);
                if (index >= 0) {
                    allUsers[index] = {
                        ...allUsers[index],
                        lastMessage: data.lastMessage ? data.lastMessage : (data.urlFile ? this._translocoService.translate('chat.send_image') : ''),
                        lastMessageTimestamp: data.lastMessageTimestamp || null,
                        userAccess: data.userAccess || {},
                        unread: data.userAccess?.[this.user.username] &&
                            data.userAccess[this.user.username] < allUsers[index].lastMessageTimestamp
                            ? true : false
                    };
                    this.userSubjects.next([...allUsers]);
                }
            }
            
        });

    });
    unsubscribeFunctions.push(unsubChatRoom);
    return () =>
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }
  async getLastMessageForUser(userId: any) {
    try {
        // Tìm chat room của user
        const chatRoomQuery = query(
            collection(this._firestore, this._chatRoom),
            where('userFBId', '==', userId)
        );
        const chatRoomSnapshot = await getDocs(chatRoomQuery);

        if (chatRoomSnapshot.empty) {
            return null;
        }

        const chatRoomId = chatRoomSnapshot.docs[0].id;

        // Lấy tin nhắn cuối cùng từ chat room
        const messagesQuery = query(
            collection(
                this._firestore,
                `${this._chatRoom}/${chatRoomId}/messages`
            ),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        if (messagesSnapshot.empty) {
            return {
                chatRoomId: chatRoomId,
                userAccess: chatRoomSnapshot.docs[0].data().userAccess,
            } as Message & { chatRoomId: string; userAccess: any };
        }

        const lastMessageDoc = messagesSnapshot.docs[0];
        return {
            id: lastMessageDoc.id,
            ...lastMessageDoc.data(),
            userAccess: chatRoomSnapshot.docs[0].data().userAccess,
            chatRoomId: chatRoomId,
        } as Message & { chatRoomId: string; userAccess: any };
    } catch (error) {
        console.error('Error getting last message for user:', error);
        return null;
    }
  }
  async updateUserDoc(
      userId: any,
      userEmail: any,
      data: any,
      userIdFirebase?: any
  ) {
      console.log('CHAY HAM UPDATE USER: ', userId, userEmail);
      const collectionRef = collection(this._firestore, 'users');
      const userDocRef = query(collectionRef, where('userId', '==', userId), where('email', '==', userEmail.email));
      const querySnapshot = await getDocs(userDocRef);
      if (!querySnapshot.empty) {
      // Lấy document đầu tiên
      const userDoc = querySnapshot.docs[0];
      const userDocRef = doc(this._firestore, 'users', userDoc.id);

      await updateDoc(userDocRef, { ...data });
      } else {
      console.log("Không tìm thấy user phù hợp");
      }
      // if(!userIdFirebase){
      // const q = query(collection(this._firestore, 'users'), where("id", "==", userId), where("email","==",userEmail));
      // const getDocSnapshot = await getDocs(q);
      // console.log("True hay false: ",getDocSnapshot.empty)

      // if(!getDocSnapshot.empty){
      //   console.log("CHAY UPDATE USER")
      //   const userDoc = getDocSnapshot.docs[0];
      //   const userRef = doc(this._firestore, 'users', userDoc.id);
      //   await updateDoc(userRef,{...data})
      // }
      // }else{
      //   const userRef = doc(this._firestore,'users',userIdFirebase);
      //   await updateDoc(userRef,{...data})
      // }
  }

  async getUserId(chatId: any) {
      const userRef = await doc(this._firestore, this._chatRoom, chatId);
      const userDoc = await getDoc(userRef);
      return userDoc.data().userFBId;
  }

  async getUserById(userId: any) {
      const userRef = await doc(this._firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.data();
  }

  getIdUser(user: any): Observable<string | null> {
      const userCollection = collection(this._firestore, 'users');
      const q = query(
          userCollection,
          where('userId', '==', user.id),
          where('username', '==', user.username)
      );

      // Sử dụng onSnapshot để liên tục query cho đến khi có kết quả
      return new Observable<string | null>((observer) => {
          const unsubscribe = onSnapshot(
              q,
              (querySnapshot) => {
                  if (!querySnapshot.empty) {
                      const doc = querySnapshot.docs[0];
                      const userId = doc.id;
                      console.log('Found user ID:', userId);
                      observer.next(userId);
                      observer.complete();
                      unsubscribe(); // Dừng listening sau khi tìm thấy
                  }
                  // Nếu chưa có kết quả, tiếp tục listening (không emit gì)
              },
              (error) => {
                  console.error('Error fetching user ID:', error);
                  observer.error(error);
                  unsubscribe();
              }
          );

          return () => unsubscribe();
      });
  }

  getAdminInfor() {
      return this._httpClient.get(uriConfig.API_ADMIN_INFOR).pipe(
          map((response: any) => {
              console.log('RESPONSE: ', response);
              console.log('ADMIN INFOR RESPONSE: ', response.data.adminInfor);
              return response.data.adminInfor;
          })
      );
  }

  initializeAdminData(): Observable<any> {
      if (this.adminData) {
          return of(this.adminData);
      }

      return this.getAdminInfor().pipe(
          tap((adminList) => {
              if (adminList && adminList.length > 0) {
                  this.adminData = adminList[0];
                  console.log('Admin data initialized:', this.adminData);
              }
          }),
          map(() => this.adminData)
      );
  }
}
