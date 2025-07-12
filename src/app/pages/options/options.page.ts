import { Component, ViewChild } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInput, IonItem, IonModal, IonRange, IonToggle } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { RouterModule } from '@angular/router';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.page.html',
  styleUrls: ['./options.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, RouterModule]
})
export class OptionsPage {

  constructor(private userConfigService: UserConfigService) {

  }

  pinFormatter(value: number) {
    return `${value}`;
  }

  getConfigValue<T>(key: any): T {
    return this.userConfigService.getConfig()[key] as T;
  }

  updateConfigValue<T>(key: any, value: T): void {
    this.userConfigService.updateConfig(key, value);
  }


  resetAll(): void {
    this.userConfigService.resetToDefault();
    location.reload();
  }

}
