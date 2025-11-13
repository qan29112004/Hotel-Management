import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    orderBy,
    Timestamp,
    deleteField,
    FieldPath,
    limit,
    deleteDoc,
    collectionData,
    collectionGroup,
    startAfter,
} from '@angular/fire/firestore';
// import { AuthService } from './auth.service';
import { UserService } from 'app/core/profile/user/user.service';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../uri/config';
import { ChatRoom, Message, FileUpload } from './chat.types';
import {
    catchError,
    from,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    tap,
    throwError,
    forkJoin,
    concat,
    reduce,
    BehaviorSubject,
} from 'rxjs';
import { UserChatConfig } from 'app/shared/components/user-card-chat/user-card-chat.types';
import {
    Storage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from '@angular/fire/storage';
import {
    filter,
    firstValueFrom,
    Subscription,
    combineLatest,
    startWith,
} from 'rxjs';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Router } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { user } from 'app/mock-api/common/user/data';
import { TranslocoService } from '@ngneat/transloco';
import { getCountFromServer, count, getFirestore } from '@firebase/firestore';
import { chunkArray } from 'app/shared/utils/chat/chunk_array.util';
import { User } from '../profile/user/user.types';
@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private _fileTasks: Map<string, FileUpload> = new Map();
    // private _firestoreRoot = getFirestore();
    
    isLoadMoreMessage: boolean = true;
    hiddenListUsers: boolean = false;
    isMobile: boolean = false;
    isOpenChatBot: boolean = false;
    isCreateChat: boolean = false;
    idChatRoom: any;
    user: any;
    private _translocoService = inject(TranslocoService);
    private _chatRoom = 'sessionChats';
    private _firestore = inject(Firestore);
    private _userService = inject(UserService);
    adminData: any;
    private _oldestDoc: any;
    private _newestDoc: any;
    private _realtimeUnsubscribe: (() => void) | null = null;
    private _storage = inject(Storage);
    private _router = inject(Router);
    private _messages: Message[];
    userSubjects: BehaviorSubject<any[]> = new BehaviorSubject([]);
    sessionChatSubject: Subject<any[]> = new Subject();
    chatRoomSubject: Subject<ChatRoom> = new Subject();
    messagesChatRoom: Subject<Message[]> = new Subject();
    lastChatRoom: Subject<ChatRoom> = new Subject();
    userChats: UserChatConfig[] = [];
    idChatWidget: string;
    isAddNewChat: boolean = false;
    private _httpClient = inject(HttpClient);
    private chatRoomUnsubscribe: (() => void) | null = null;
    private _lastChatRoomSubscription: (() => void) | null = null;
    private _messageListeners: Map<number, () => void> = new Map();

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

    async deleteSessionChatDoc(chatId: any) {
        const chatDoc = doc(this._firestore, this._chatRoom, chatId);
        await deleteDoc(chatDoc);
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
            await this.updateUserDoc(
                data.userId,
                user,
                { lastMessageTimestamp: data.lastMessageTimestamp },
                userId
            );
        }
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

                        return this.getAdminInfor().pipe(
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

    uploadFile(files: File[]) {
        const formData = new FormData();
        for (const file of files) {
            formData.append('file', file);
        }
        return this._httpClient.post(uriConfig.API_GET_IMAGE, formData).pipe(
            map((response: any) => {
                console.log('RESPONSE: ', response);
                return response.data.files;
            })
        );
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

    async compressImage(file: File): Promise<File> {
        console.time(`compressImage-${file.name}`);
        if (!file.type.startsWith('image/') || file.size <= 0.5 * 1024 * 1024) {
            console.timeEnd(`compressImage-${file.name}`);
            return file;
        }

        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
                initialQuality: 0.6,
            };
            const compressedFile = await imageCompression(file, options);
            console.timeEnd(`compressImage-${file.name}`);
            return compressedFile.size < file.size ? compressedFile : file;
        } catch (error) {
            console.warn('Image compression failed for', file.name, ':', error);
            console.timeEnd(`compressImage-${file.name}`);
            return file;
        }
    }

    generateFileName(file: File, chatRoomId: string): string {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const extension = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${chatRoomId}_${timestamp}_${randomId}_${safeName}`;
    }

    uploadSingleFile(file: File, chatRoomId: string): Observable<string> {
        const fileName = this.generateFileName(file, chatRoomId);
        const filePath = `myimage/${chatRoomId}/${fileName}`;

        return from(this.compressImage(file)).pipe(
            switchMap((compressedFile) => {
                console.time(`uploadSingleFile-${file.name}`);
                const storageRef = ref(this._storage, filePath);
                console.time(`uploadBytesResumable-${file.name}`);
                const uploadTask = uploadBytesResumable(
                    storageRef,
                    compressedFile
                );
                this._fileTasks.set(file.name, {
                    file: compressedFile,
                    uploadTask: uploadTask,
                    status: 'uploading',
                    storageRef: storageRef,
                });

                return new Observable<void>((observer) => {
                    uploadTask.on(
                        'state_changed',
                        () => {},
                        (error) => {
                            observer.error(error);
                        },
                        () => {
                            const fileTask = this._fileTasks.get(file.name);
                            if (fileTask && fileTask.status !== 'canceled') {
                                fileTask.status = 'uploaded';
                                this._fileTasks.set(file.name, fileTask);
                                observer.next();
                                observer.complete();
                            } else {
                                deleteObject(fileTask.storageRef)
                                    .then(() => {
                                        console.log(
                                            `File ${file.name} deleted successfully`
                                        );
                                    })
                                    .catch((error) => {
                                        console.error(
                                            `Error deleting file ${file.name}:`,
                                            error
                                        );
                                    });
                                this._fileTasks.delete(file.name);
                                observer.complete();
                            }
                        }
                    );
                }).pipe(
                    switchMap(() => {
                        console.timeEnd(`uploadBytesResumable-${file.name}`);
                        console.time('getDownloadURL');
                        return from(getDownloadURL(storageRef)).pipe(
                            tap((url) => {
                                const fileTask = this._fileTasks.get(file.name);
                                if (fileTask) {
                                    fileTask.status = 'urlFetched';
                                    fileTask.url = url;
                                    this._fileTasks.set(file.name, fileTask);
                                } else {
                                    deleteObject(storageRef)
                                        .then(() => {
                                            console.log(
                                                `File ${file.name} deleted successfully`
                                            );
                                        })
                                        .catch((error) => {
                                            console.error(
                                                `Error deleting file ${file.name}:`,
                                                error
                                            );
                                        });
                                    this._fileTasks.delete(file.name);
                                }
                                console.timeEnd('getDownloadURL');
                            })
                        );
                    }),
                    catchError((error) => {
                        console.error(`Upload failed for ${file.name}:`, error);
                        return of('');
                    })
                );
            }),
            tap(() => console.timeEnd(`uploadSingleFile-${file.name}`)),
            catchError((error) => {
                console.error(`Error processing ${file.name}:`, error);
                return of('');
            })
        );
    }

    uploadFilesToFirebase(
        files: File[],
        chatRoomId: string
    ): Observable<string[]> {
        if (!files || files.length === 0) {
            return of([]);
        }

        console.log(
            `Starting upload of ${files.length} files to chatroom: ${chatRoomId}`
        );
        console.time(`uploadFilesToFirebase-${chatRoomId}`);

        const validFiles = files.filter((file) => {
            const maxSize = 10 * 1024 * 1024;
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
            ];

            if (file.size > maxSize) {
                console.warn(`File ${file.name} exceeds size limit`);
                return false;
            }

            if (!allowedTypes.includes(file.type)) {
                console.warn(`File ${file.name} has unsupported type`);
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) {
            return throwError(() => new Error('No valid files to upload'));
        }

        const concurrencyLimit = 3;
        const batches: Observable<string[]>[] = [];

        for (let i = 0; i < validFiles.length; i += concurrencyLimit) {
            const batch = validFiles.slice(i, i + concurrencyLimit);
            const batchObservables = batch.map((file) =>
                this.uploadSingleFile(file, chatRoomId)
            );

            batches.push(
                forkJoin(batchObservables).pipe(
                    map((urls) => urls.filter((url) => url && url.length > 0))
                )
            );
        }

        return concat(...batches).pipe(
            reduce((acc, urls) => [...acc, ...urls], [] as string[]),
            tap(() => console.timeEnd(`uploadFilesToFirebase-${chatRoomId}`)),
            tap((results) =>
                console.log(
                    `Upload completed. Success: ${results.length}/${validFiles.length}`
                )
            ),
            catchError((error) => {
                console.error('Upload batch failed:', error);
                return of([]);
            })
        );
    }

    cancelFileUpload(fileName: string): Observable<void> {
        const fileTask = this._fileTasks.get(fileName);
        if (!fileTask || !fileTask.uploadTask) {
            return throwError(
                () => new Error(`No upload task found for file: ${fileName}`)
            );
        }

        console.log(`Cancelling upload for file: ${fileName}`);
        if (fileTask.status === 'uploading') {
            fileTask.uploadTask.cancel();
            this._fileTasks.delete(fileName);
            return of();
        } else if (
            fileTask.status === 'urlFetched' ||
            fileTask.status === 'uploaded'
        ) {
            return from(deleteObject(fileTask.storageRef)).pipe(
                tap(() => {
                    console.log(`File ${fileName} deleted successfully`);
                    this._fileTasks.delete(fileName);
                }),
                catchError((error) => {
                    console.error(`Error deleting file ${fileName}:`, error);
                    return throwError(() => error);
                })
            );
        }

        return new Observable<void>((observer) => {
            observer.next();
            observer.complete();
        });
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

    async countTotalMessages(): Promise<number> {
        const messagesRef = collectionGroup(this._firestore, 'messages');
        const snapshot = await getDocs(messagesRef);
        return snapshot.size;
    }

    constructor() {}

    cleanupMessageListeners() {
        if (this._messageListeners) {
            this._messageListeners.forEach((unsubscribe) => unsubscribe());
            this._messageListeners.clear();
        }
    }

   uploadAudio(formData: FormData): Observable<{
    code: string;
    message: string;
    data: { text: string };
}> {
    return this._httpClient.post<{
        code: string;
        message: string;
        data: { text: string };
    }>(uriConfig.API_UPLOAD_AUDIO, formData);
}
}
