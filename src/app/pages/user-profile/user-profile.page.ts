import { Component, OnInit } from '@angular/core';
import { IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonImg, IonItem, IonLabel, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { AccountComponent } from "./account/account.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { User } from 'firebase/auth';
import { UserDto } from './user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: true,
  imports: [IonImg, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonContent, CommonModule, FormsModule, AccountComponent, HeaderComponent]
})
export class UserProfilePage implements OnInit {
  userAuth: User;
  userData: UserDto;

  constructor(authService: LoginFireauthService, userService: UserFirestoreService) {
    this.userAuth = authService.getAuthUser()!
    this.userData = userService.getUserData()!
  }

  ngOnInit() {
  }

}
