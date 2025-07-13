import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonCard, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
import { UserConfigService } from "src/app/services/userconfig.service";
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {


  constructor(private cdr: ChangeDetectorRef, private userConfigService: UserConfigService, private userFirestoreService: UserFirestoreService, private router: Router, private location: Location) { }


  ngOnInit() {

  }

  ngAfterViewInit() {

  }

  ngOnDestroy(): void {

  }


  goBack(): void {
    this.location.back();
  }
}

