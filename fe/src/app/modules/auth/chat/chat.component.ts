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
import { GroupByStatusPipe } from 'app/shared/pipes/detached_list_by_status.pipe';
import { SortBaseOnTimestampUtil } from 'app/shared/utils/chat/sort_session_chat.util';
import { MatIconModule } from '@angular/material/icon';
import { DeleteChatComponent } from './delete-chat/delete-chat.component';
import { formatTimestamp, subTime } from 'app/shared/utils/chat/format_time.util';
import { TranslocoModule } from '@ngneat/transloco';
import { environment } from 'environments/environment.fullstack';
import { MessageSocket } from '../../../core/chat/chat.types';
import { DenseLayoutComponent } from 'app/layout/layouts/vertical/dense/dense.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, UserCardChatComponent, RouterOutlet, TruncatePipe, MatIconModule, DeleteChatComponent, TranslocoModule, GroupByStatusPipe],
  templateUrl: './chat.component.html',
  styles:``
})
export class ChatComponent implements OnInit, OnDestroy {
  listRequirement:any[];
  baseUrl:string = environment.baseUrl;
  chatService = inject(ChatService);
  private timeUpdateSubscription:Subscription;
  private messageSubscription: Subscription;
  private usersSubscription: Subscription;
  private _destroy = new Subject<void>();
  private _userService = inject(UserService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _idDeleteChat;
  isJoin:boolean;

  constructor(private denseLayout:DenseLayoutComponent) {
    
  }

  ngOnInit() {
    this.chatService.getAllRequirementChat().subscribe(res=>{
      console.log("requirement:", res.data)
      this.listRequirement = res.requirements;
      this.isJoin == res.isJoin;
    })

    this.messageSubscription = this.chatService.messages$.subscribe(msg =>{
        console.log("CHECK MSG FROM BE: ",msg)
        if(msg.action === "join_group" && msg.status ==='success'){
          this.listRequirement = this.listRequirement.map(item =>
            item.uuid === msg.group ? { ...item, status: 'In progress' } : item
          );
        this.isJoin = true;
      }
        if(msg.action === "out_group" && msg.status ==='success'){
          this.listRequirement = this.listRequirement.map(item =>
            item.uuid === msg.group ? { ...item, status: 'Normal' } : item
          );
        this.isJoin = false;
      }
        if(msg.action === "send_requirement"){
          console.log("check require: ", msg.data)
          this.listRequirement = [...this.listRequirement, msg.data];
        }
    })
    
  };

  
  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if(this.timeUpdateSubscription){
      this.timeUpdateSubscription.unsubscribe();
    }
  }

  requestJoin(uuid:string){
    const payload:MessageSocket = {
      'action':"join_group",
      'group_name':uuid
    }
    this.chatService.sendMessage(payload);
  }

}
