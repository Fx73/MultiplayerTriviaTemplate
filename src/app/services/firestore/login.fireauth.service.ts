import { Auth, FacebookAuthProvider, GoogleAuthProvider, User, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth';

import { AppComponent } from '../../app.component';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class LoginFireauthService {
  private auth: Auth = getAuth();

  getAuthUser(): User | null {
    return this.auth.currentUser;
  }

  public listenForUserChanges(callback: (user: User | null) => void): void {
    const auth: Auth = getAuth();
    onAuthStateChanged(auth, (firebaseUser: User | null) => {
      callback(firebaseUser);
    });
  }

  //#region Login
  register(email: string, password: string): void {
    createUserWithEmailAndPassword(this.auth, email, password)
      .catch((error) => {
        console.log(email)
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }

  login(email: string, password: string): void {
    signInWithEmailAndPassword(this.auth, email, password)
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }

  loginWithFacebook() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(this.auth, provider)
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }

  passwordRecovery(email: string): void {
    sendPasswordResetEmail(this.auth, email)
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }
  //#endregion

  //#region Account
  resendEmail(): void {
    if (this.auth.currentUser)
      sendEmailVerification(this.auth.currentUser)
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          AppComponent.presentWarningToast(errorMessage)
          alert(errorCode);
        });
  }

  updatePassword(password: string) {
    if (this.auth.currentUser)
      updatePassword(this.auth.currentUser, password).then(() => {
        alert('Password updated');
      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }

  updateProfile(email: string, name: string) {
    if (this.auth.currentUser)
      updateEmail(this.auth.currentUser, email).then(() => {
        updateProfile(this.auth.currentUser!, { displayName: name }).then(() => {
          alert('Profile updated');
        }).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          AppComponent.presentWarningToast(errorMessage)
          alert(errorCode);
        });

      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }
  //#endregion

  logOut(): void {
    signOut(this.auth)
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        AppComponent.presentWarningToast(errorMessage)
        alert(errorCode);
      });
  }
}
