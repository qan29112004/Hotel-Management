import { Routes } from '@angular/router';
import { ChatComponent } from 'app/modules/auth/chat/chat.component';
import { ChatGuard, UserAccessChatGuard } from 'app/core/chat/guard/chat.guard';

const routes: Routes = [
  {
    path: '',
    component: ChatComponent,
    // canActivateChild: [ChatGuard]
  }
];

export default routes;
