import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { Injectable } from '@angular/core';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { Router } from '@angular/router';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Injectable({
    providedIn: 'root'
})
export class UserGuard {

    constructor(private loginFireauthService: LoginFireauthService, private userFirestoreService: UserFirestoreService, private router: Router) { }

    async canActivate(): Promise<boolean> {
        if (this.loginFireauthService.getAuthUser() && this.userFirestoreService.getUserData())
            return true
        try {
            const isLogged = await this.guardWaitForAuth();
            if (!isLogged) {
                this.router.navigate(['/home']);
                return false;
            }

            const isUserFetched = this.guardWaitForUserDataFetch();
            if (!isUserFetched) {
                this.router.navigate(['/home']);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in Editor Guard:', error);
            return false;
        }
    }

    private guardWaitForAuth(): Promise<boolean> {
        const timeout = 500;
        let timeoutId: NodeJS.Timeout;

        return new Promise<boolean>((resolve) => {
            const unsubscribeFun = onAuthStateChanged(getAuth(), (_user) => {
                clearTimeout(timeoutId);
                unsubscribeFun();
                resolve(!!_user);
            });

            timeoutId = setTimeout(() => {
                unsubscribeFun();
                resolve(false);
            }, timeout);
        });
    }

    private guardWaitForUserDataFetch(): Promise<boolean> {
        const timeout = 500;
        let timeoutId: NodeJS.Timeout;

        return new Promise<boolean>((resolve) => {
            const subscription = this.userFirestoreService.userData$.subscribe(user => {
                if (user) {
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();
                    resolve(true);
                }
            });

            timeoutId = setTimeout(() => {
                subscription.unsubscribe();
                resolve(false);
            }, timeout);
        });
    }

}
