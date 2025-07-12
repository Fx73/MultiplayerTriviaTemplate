import { Component, NgZone, OnInit } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonInput, IonItem, IonLabel, IonRow, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginComponent } from "../../shared/user/login/login.component";
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserDto } from '../user-profile/user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonInput, IonCol, IonRow, IonGrid, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonCard, IonButton, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule, LoginComponent, IonCardSubtitle]
})
export class WelcomePage implements OnInit {
  userData: UserDto | null = null;
  gameCode: string = ""

  constructor(private router: Router, userService: UserFirestoreService) {
    userService.userData$.subscribe(userData => this.userData = userData)
  }

  ngOnInit() {
  }



  isUserLoggedIn() {
    return this.userData !== null
  }

  joinGame() {
    if (this.gameCode.trim()) {
      this.router.navigate(['/lobby', this.gameCode]);
    }
  }

}
