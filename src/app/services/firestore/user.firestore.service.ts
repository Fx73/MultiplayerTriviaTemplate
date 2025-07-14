import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

import { Injectable } from '@angular/core';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { SimpleFirestoreConverter } from './firestore.converter';
import { User } from 'firebase/auth';
import { UserDto } from 'src/app/pages/user-profile/user.dto';

@Injectable({
    providedIn: 'root'
})
export class UserFirestoreService {
    //#region Constants
    private readonly USER_COLLECTION = "users"
    private readonly firestoreConverterUser = new SimpleFirestoreConverter<UserDto>(UserDto)

    //#endregion

    private db: Firestore
    private user: UserDto | null = null;
    private userDataSubject = new BehaviorSubject<UserDto | null>(null);
    get userData$(): Observable<UserDto | null> {
        return this.userDataSubject.asObservable();
    }
    public getUserData(): UserDto | null {
        return this.user;
    }

    constructor(loginFireauthService: LoginFireauthService) {
        this.db = getFirestore()
        loginFireauthService.listenForUserChanges(firebaseUser => {
            if (firebaseUser) {
                this.getUserFromFirestore(firebaseUser).then(user => {
                    this.user = user
                    this.userDataSubject.next(user);
                })
            } else {
                this.user = null;
                this.userDataSubject.next(null);
            }
        })
    }

    private async getUserFromFirestore(firebaseUser: User): Promise<UserDto> {
        const userRef = doc(this.db, this.USER_COLLECTION, firebaseUser.uid).withConverter(this.firestoreConverterUser);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            const userData: UserDto = userSnapshot.data();
            return userData
        } else {
            const newUser = new UserDto(firebaseUser.uid, firebaseUser.displayName || 'Unknown User');
            await setDoc(userRef, newUser);

            return newUser;
        }
    }

    async getUserNameMap(userIds: string[]): Promise<Map<string, string>> {
        if (userIds.length === 0) return new Map();

        const userRefs = userIds.map(id => doc(this.db, this.USER_COLLECTION, id).withConverter(this.firestoreConverterUser));
        const userSnaps = await Promise.all(userRefs.map(ref => getDoc(ref)));

        const map = new Map<string, string>();
        userSnaps.forEach((snap, index) => {
            const id = userIds[index];
            const data = snap.data();
            map.set(id, data?.name ?? 'Unknown');
        });

        return map;
    }


}
