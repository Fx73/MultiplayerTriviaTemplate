import { Component, ViewChild } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { logoGoogle, person } from 'ionicons/icons';

import { LoginComponent } from './login/login.component';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  standalone: true,
  imports: [IonicModule, NgIf],
})
export class UserComponent {
  @ViewChild('userpopover', { static: false }) userpopover!: HTMLIonPopoverElement;

  public static user: User | null = null
  get user(): User | null {
    return UserComponent.user
  }
  set user(value: User | null) {
    UserComponent.user = value
  }

  constructor(private router: Router, private popoverController: PopoverController, private loginService: LoginFireauthService) {
    loginService.listenForUserChanges(user => this.user = user)
    addIcons({
      'person': person,
      'logoGoogle': logoGoogle
    });
  }


  async presentPopover(e: Event) {
    let popover: HTMLIonPopoverElement;
    if (this.user) {
      popover = this.userpopover
      popover.event = e
    } else {
      popover = await this.popoverController.create({
        component: LoginComponent,
        componentProps: {
          isSmall: true
        },
        event: e,
      });
    }

    await popover.present();
    await popover.onDidDismiss();
  }



  logout() {
    this.loginService.logOut()
    this.popoverController.dismiss().then(() => {
      this.router.navigateByUrl('home')
    }
    );
  }


}


