import { inject } from "@angular/core";
import { CanActivateFn, CanActivateChildFn, Router, CanDeactivateFn } from "@angular/router";
import { UserService } from "app/core/profile/user/user.service";
import { routeConfig } from "app/core/uri/config.route";
import { doc, Firestore, getDoc } from "@angular/fire/firestore";
import { get } from "lodash";
import { from, of, switchMap } from "rxjs";
import {ChatRoomDeActivate} from "app/core/chat/chat.types";

export const ChatGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    let userId: any;
    let userRole: any;
    const userService = inject(UserService);
    const isAuthenticated = true;
    const router: Router = inject(Router);
    const chatId = route.params['id'];
    const firestore: Firestore = inject(Firestore);
    const chatRoomRef = doc(firestore, "sessionChats", chatId);
    
    return userService.user$.pipe(
        switchMap((user) => {
            userId = get(user, 'id', null);
            userRole = get(user, 'role', null);
            console.log("USER ROLE: ", userRole);
            console.log("USER ID: ", userId);
            
            return from(getDoc(chatRoomRef)).pipe(
                switchMap((docSnap) => {
                    console.log("TRUE OR FALSE: ", userRole === 3 && get(docSnap.data(), 'userId') !== userId);
                    console.log("USER ROLE: ", userRole);
                    console.log("USER ID: ", typeof userId);
                    console.log("DOC USER ID: ", typeof get(docSnap.data(), 'userId'));
                    if (!docSnap.exists()) {
                        const urlNotFound = router.parseUrl(routeConfig.ROUTER_NOT_FOUND);
                        return of(urlNotFound);
                    } else if (
                        userRole === 3 && get(docSnap.data(), 'userId') !== userId
                    ) {
                        const urlNotFound = router.parseUrl(routeConfig.ROUTER_NOT_FOUND);
                        return of(urlNotFound);
                    }
                    return of(true);
                })
            );
        })
    );
}


export const UserAccessChatGuard: CanDeactivateFn<any> = (component: ChatRoomDeActivate) => {
    component.ExitChatRoom();
    return true;
}