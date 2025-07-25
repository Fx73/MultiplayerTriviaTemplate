import { Component, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { LoginComponent } from "../../shared/user/login/login.component";
import { UserDto } from '../user-profile/user.dto';
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';
import { generateAlphaNumCode } from 'src/app/shared/util';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonInput, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonCard, IonButton, IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule, LoginComponent, IonCardSubtitle]
})
export class WelcomePage implements OnInit {
  userData: UserDto | null = null;
  gameCode: string = ""

  constructor(private router: Router, userService: UserFirestoreService) {
    userService.userData$.subscribe(userData => this.userData = userData)
  }

  ngOnInit() {
  }


  async createGame() {
    this.gameCode = this.gameCode.trim()
    if (!this.gameCode)
      this.gameCode = generateAlphaNumCode(20)
    if (this.gameCode.length < 4)
      this.gameCode += "-" + generateAlphaNumCode(12)

    this.router.navigate(['/lobby', this.gameCode], { state: { isCreate: true } });
  }

  async joinGame() {
    this.router.navigate(['/lobby', this.gameCode]);
  }


}
