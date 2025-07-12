import { Component, OnInit } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { logoAngular, logoCss3, logoHtml5, logoIonic } from 'ionicons/icons';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCardContent, IonCard, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class AboutPage implements OnInit {

  constructor() {
    addIcons({ logoIonic, logoAngular, logoHtml5, logoCss3 });

  }

  ngOnInit() {
  }

}
