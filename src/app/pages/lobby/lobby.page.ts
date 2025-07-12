import { ActivatedRoute, Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { IonicModule } from '@ionic/angular';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { LobbyService } from 'src/app/services/lobby.service';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyPage implements OnInit {
  lobbyCode: string = "";
  username: string = "";
  selectedSize = 8

  categoryList: string[] = []
  subcategoryList: string[] = []

  static categoryPicked: string | null = null;
  get categoryPicked() { return LobbyPage.categoryPicked }
  set categoryPicked(value) { LobbyPage.categoryPicked = value }

  static subcategoryPicked: string | null = null;
  get subcategoryPicked() { return LobbyPage.subcategoryPicked }
  set subcategoryPicked(value) { LobbyPage.subcategoryPicked = value }

  static isMaster: boolean = false
  get isMaster() { return LobbyPage.isMaster }

  constructor(private route: ActivatedRoute, private router: Router, private userConfigService: UserConfigService, private itemService: ItemFirestoreService) {
    this.username = this.userConfigService.getConfig()['gameName'];
    const lobbyId = this.route.snapshot.paramMap.get('id');
    if (lobbyId) {
      LobbyPage.isMaster = false
    } else {
      this.lobbyCode = "NewLobbyID"
      LobbyPage.isMaster = true
    }

  }

  ionViewWillLeave() {
    if (this.router.url.startsWith('/game'))
      return

  }

  ngOnInit() {

  }

  onLobbyDontExist() {
    AppComponent.presentWarningToast("Lobby does not exists")
    this.router.navigateByUrl('home')
  }




  copyToClipboard() {
    navigator.clipboard.writeText("https://" + window.location.hostname + this.router.url + "/" + this.lobbyCode);
    AppComponent.presentOkToast("Code Copied")
  }



  updateName<T>(): void {
    this.userConfigService.updateConfig('gameName', this.username);
  }



}
