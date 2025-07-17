import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';

import { GameInstance } from './services/game.instance';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  static appInstance: AppComponent;
  static gameInstance: GameInstance;

  constructor(private toastController: ToastController) {
    AppComponent.appInstance = this;
  }

  ngOnInit() {
  }




  //#region Toasts
  async presentPrimaryToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'primary'
    });
    toast.present();
  }

  async presentOkToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'success'
    });
    toast.present();
  }

  async presentWarningToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'warning'
    });
    toast.present();
  }

  async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 6000,
      color: 'danger'
    });
    toast.present();
  }

  static presentPrimaryToast(message: string) {
    console.log(message)
    AppComponent.appInstance.presentPrimaryToast(message)
  }

  static presentOkToast(message: string) {
    console.log(message)
    AppComponent.appInstance.presentOkToast(message)
  }
  static presentWarningToast(message: string) {
    console.warn(message)
    AppComponent.appInstance.presentWarningToast(message)
  }
  static presentErrorToast(message: string) {
    console.error(message)
    AppComponent.appInstance.presentErrorToast(message)
  }
  //#endregion
}
