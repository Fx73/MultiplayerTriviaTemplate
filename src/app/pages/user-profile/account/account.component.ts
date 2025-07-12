import { Component, Input, input } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule],
})
export class AccountComponent {

  name: string = '';
  email: string = '';
  password: string = '';
  password2: string = '';
  isEmailVerified: Boolean = false;

  constructor(private loginService: LoginFireauthService) {
    const user = loginService.getAuthUser()
    this.name = user!.displayName ?? ""
    this.email = user!.email ?? ""
    this.isEmailVerified = user!.emailVerified

  }

  saveProfile() {
    this.loginService.updateProfile(this.email, this.name)
  }
  savePassword() {
    if (this.password === this.password2)
      this.loginService.updatePassword(this.password)
  }
  resendEmail() {
    this.loginService.resendEmail()
  }
  logOut() {
    this.loginService.logOut()
  }

}
