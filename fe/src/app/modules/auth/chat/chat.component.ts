import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatBubbleConfig } from '../../../shared/components/chat-bubble/chat-bubble.types';
import { UserCardChatComponent } from '../../../shared/components/user-card-chat/user-card-chat.component';
import { UserChatConfig } from '../../../shared/components/user-card-chat/user-card-chat.types';
import { ChatService } from '../../../core/chat/chat.service';
import { ChatRoom, Message } from '../../../core/chat/chat.types';
import { UserService } from 'app/core/profile/user/user.service';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Router, ActivatedRoute,RouterOutlet } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter, map, take, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Status, User, Role  } from 'app/core/profile/user/user.types';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { TranslocoService } from '@ngneat/transloco';
import { of, Subscription, firstValueFrom, Subject, interval } from 'rxjs';
import { TruncatePipe } from 'app/shared/pipes/truncate.pipe';
import { SortBaseOnTimestampUtil } from 'app/shared/utils/chat/sort_session_chat.util';
import { MatIconModule } from '@angular/material/icon';
import { DeleteChatComponent } from './delete-chat/delete-chat.component';
import { formatTimestamp, subTime } from 'app/shared/utils/chat/format_time.util';
import { TranslocoModule } from '@ngneat/transloco';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, UserCardChatComponent, RouterOutlet, TruncatePipe, MatIconModule, DeleteChatComponent, TranslocoModule],
  templateUrl: './chat.component.html',
  styles:``
})
export class ChatComponent implements OnInit, OnDestroy {
  listUserTest:any[];


  
  initialWidth = window.innerWidth;
  _activeSessionId: any;
  translocoService = inject(TranslocoService);
  isDeleteChatModal:boolean = false;
  crrNameChatRoom:string;
  expandedUserId: string | null = null;
  chatRoomData!: ChatRoom;
  chats: ChatBubbleConfig[] = [];
  listUsers: any[];
  userChats: UserChatConfig[] = [];
  user:any;
  inforUserFB:any;
  senderUser :any;
  // authService = inject(AuthService);
  currentUser: any;
  chatService = inject(ChatService);
  adminInfor:any;
  isLoadingUser: boolean = true;
  listUserFromDB: Set<String> = new Set<String>();
  
  private timeUpdateSubscription:Subscription;
  private sessionChatsSub: Subscription;
  private usersSubscription: Subscription;
  private _destroy = new Subject<void>();
  private _userService = inject(UserService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _idDeleteChat;

  ngOnInit() {
    console.log("USER SERVICE: ", this.chatService.userChats);
    this._userService.user$.subscribe(user => {
        this.user = user;
        this.chatService.user = user;
    });
    const mediaQuery = window.matchMedia('(max-width: 600px)');
    this.chatService.isMobile = mediaQuery.matches && this.user.role === 1;

    mediaQuery.addEventListener('change', (e) => {
      console.log("MEDIA QUERY CHANGE: ", e.matches);
      this.chatService.isMobile = e.matches && this.user.role === 1;
      this.chatService.hiddenListUsers = !e.matches;
    });
    

    this.chatService.getAdminInfor().subscribe({
      next: (response) => {
        this.adminInfor = response.map(adminInfor => ({
          id: adminInfor.id,
          username: adminInfor.username,
          avatar: adminInfor.avatar,
        }));
      },
      error: (error) => {
        console.error('Error fetching admin info:', error);
      }
    });

    if(this.user.role === 3){
      this.chatService.getIdUser(this.user).pipe(
        switchMap(crrUserFBId => {
          return this.chatService.getChatRoomIdByUserId(crrUserFBId);
        }),
        takeUntil(this._destroy)
      ).subscribe({
        next: (chatId) => {
          this.chatService.hiddenListUsers = true;
          if (chatId) {
            this._router.navigate(['/chat', chatId],{
              state: {
                inforAdmin: this.adminInfor
              }
            });
          }
        },
        error: (error) => {
          console.error("Error getting chat room ID:", error);
        }
      });
    }
    else {
      // Initialize users subscription for real-time updates
      this.initializeUsersSubscription();
    }
    // old la check active session id
    if(!this._activeSessionId){
      const chatId = this._route.firstChild?.snapshot.paramMap.get('id');
      console.log("CHAY HAM INIT CHA (ngOnInit)", chatId);
      this._activeSessionId = chatId;
      this.chatService.getUserId(chatId)
      .then(result=>{
        this.expandedUserId = result;
        this.chatService.hiddenListUsers=true;
        console.log("END NAVIGATE USER: ", this.expandedUserId)
        // this.getSessionChats(result);
      })
      .catch(error=>{
        console.log("ERROR");
      })
    }

    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this._destroy)
    ).subscribe(() => {
      if(this.chatService.user.role === 3 && this._router.url === `/chat`){
        this.chatService.hiddenListUsers = true;
        this._router.navigate(['/chat', this.chatService.idChatRoom],{
              state: {
                inforAdmin: this.chatService.adminData
              }
            });
      }else if(this.user.role === 1 && this._router.url === `/chat`){
        this.expandedUserId = null;
        if(this.chatService.isMobile === true){
          this.chatService.hiddenListUsers = false;
        }else if(this.chatService.isMobile === false && this.chatService.hiddenListUsers === false){
          this.chatService.hiddenListUsers = true;
        } 
        console.log("CO SET ACTIVE SESSION ID NULL");
      }
      this.chatService.isLoadMoreMessage=true;
      const chatId = this._route.firstChild?.snapshot.paramMap.get('id');
      console.log("CHAY HAM INIT CHA (NavigationEnd)", chatId);
      if (chatId) {
        this._activeSessionId = chatId;
        
      } else {
        this._activeSessionId = null;
      }
      
    });
      
    this.timeUpdateSubscription = interval(60000).pipe(
      takeUntil(this._destroy)
    ).subscribe(() => {
      this.updateFormattedTimes();
      
    });
    
  };

  updateFormattedTimes() {
    if(this.listUsers){
      this.listUsers = this.listUsers.map(user => ({
        ...user,
        formattedLastMessageTime: user.lastMessageTimestamp
          ? subTime(user.lastMessageTimestamp, this.translocoService)
          : ''
      }));
    }
  }
  
  formatSubTime(timestamp:any){
    return subTime(timestamp,this.translocoService)
  }

  initializeUsersSubscription() {
    this._userService.getAllUser().pipe(
      tap(users => {
        // this.listUserFromDB = new Set(users.map(user => `${user.id}-${user.username}`));
        this.listUserTest = users;
        console.log("List user from DB: ", users);
      }),
      takeUntil(this._destroy)
    ).subscribe(users=>{
      if (this.usersSubscription) {
        this.usersSubscription.unsubscribe();
      }
      console.log("Before calling getAllUsers, listUserTest:", this.listUserTest);
      this.chatService.getAllUsers(this.listUserTest);
      this.usersSubscription = this.chatService.userSubjects
        .pipe(
          map((users) =>
              SortBaseOnTimestampUtil(users)
              // .filter(user => this.listUserFromDB.has(`${user.userId}-${user.username}`))
              .map(user => ({
                ...user,
                formattedLastMessageTime: user.lastMessageTimestamp
                  ? this.formatSubTime(user.lastMessageTimestamp)
                  : ''
              }))
          ),
          takeUntil(this._destroy)
        )
        .subscribe((sortedUsers) => {
          console.log("gan listuser")
          this.listUsers = sortedUsers;
          console.log("Users updated and sorted:", this.listUsers);
          console.log("SET LOADING USER")
          if(sortedUsers.length > 0){ 
            this.isLoadingUser = false;
          }
        });
      
    });
    
  }


  

  chooseUser(user:any){
    console.log("USER ID CLICK: ", user);
    this.expandedUserId = this.expandedUserId =user.id;
    this._activeSessionId = user.chatRoomId;
    console.log("EXPAND: ", this.expandedUserId);
    if(this.chatService.isMobile===true){
      this.chatService.hiddenListUsers = true;
    }
    // this.inforUserFB = await this.chatService.getUserById(userId.id);

    // this.chatService.getChatRoomIdByUserId(user.id).pipe(
    //   tap(res=>{
    //     console.log("res",res);
    //     this._router.navigate(['/chat', res],
    //       {
    //       state: {
    //         expandedUserId: this.expandedUserId,
    //         inforUser: user
    //       }
    //     }
    //     );
    //   }),
    //   takeUntil(this._destroy)
    // ).subscribe();
    this._router.navigate(['/chat', user.chatRoomId],
          {
          state: {
            expandedUserId: this.expandedUserId,
            inforUser: user,
          }
        }
        );
    
  }


  

  // private updateUserChats(chat: any[]) {
  //   console.log(this.user);
  //   this.chatService.userChats = chat.map((item, index) => ({
  //       chatRoomId: item.id,
  //       crrUserId: item.userId,
  //       fullName: item.title,
  //       time: this.formatTimestamp(item.lastMessageTimestamp),
  //       lastMessage:item.lastMessage,
  //       isActive: item.id === this._activeSessionId,
  //       unreadCount: item.userAccess[this.user.username] && item.userAccess[this.user.username] < item.lastMessageTimestamp? true:false,
  //       onClick: () => {
  //         if (!item || !item.id) {
  //           console.error('Item hoặc item.id bị undefined!');
  //           return;
  //         };
          
  //         this._router.navigate(['/chat', item.id]);
  //       }
  //     }));
  //     this.userChats = this.chatService.userChats;

      
      
  // }

  async onNewChatClick() {
    this._userService.user$.pipe(
      take(1),
      switchMap(user => this.chatService.createNewSessionChat(user, true)),
      takeUntil(this._destroy)
    ).subscribe({
      error: (error) => {
        console.error('Error creating new chat:', error);
      }
    });
  }
  
  openModalDeleteChat(chatId:any):void{
    this.isDeleteChatModal = true;
    this._idDeleteChat = chatId;
  }
  closeModalDeleteChat():void{
    this.isDeleteChatModal = false;
  }

  async submitDeleteChat(){
    await this.chatService.deleteSessionChatDoc(this._idDeleteChat);
    this.isDeleteChatModal = false;
    this.chatService.getLastCreatedAtChatRoom(this.user.id);
    this.chatService.lastChatRoom.pipe(
      tap((chatRoom)=>{
        this._router.navigate(['/chat', chatRoom.chatRoomId]);
      }),
      takeUntil(this._destroy)
    ).subscribe();
    
}

  // getSessionChats(chatId:BigInt){
  //   this.chatService.getAllSessionChats();

  //   if (this.sessionChatsSub) {
  //     this.sessionChatsSub.unsubscribe();
  //   }

  //   this.sessionChatsSub = this.chatService.sessionChatSubject.pipe(
  //     switchMap((chat) => 
  //       of(SortBaseOnTimestampUtil(chat.filter((item) => item.userId === chatId)))
          
  //     )
  //   ).subscribe((filterChat) => {
  //     this.updateUserChats(filterChat as any[]);
  //     console.log("USER CHAT: ", this.userChats)
  //   });    
  // }
  
  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
    if (this.sessionChatsSub) {
      this.sessionChatsSub.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if(this.timeUpdateSubscription){
      this.timeUpdateSubscription.unsubscribe();
    }
    this.chatService.cleanupMessageListeners();
  }


}
