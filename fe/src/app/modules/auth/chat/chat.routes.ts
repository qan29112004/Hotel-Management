import { Routes } from '@angular/router';
import { ChatComponent } from 'app/modules/auth/chat/chat.component';
import { ChatContentComponent } from './chat-content/chat-content.component';
import { ChatGuard, UserAccessChatGuard } from 'app/core/chat/guard/chat.guard';

const routes: Routes = [
  {
    path: '',
    component: ChatComponent,
    canActivateChild: [ChatGuard],
    children: [
      {path:':id', component: ChatContentComponent, canDeactivate: [UserAccessChatGuard] },
    ]
  }
];

export default routes;
