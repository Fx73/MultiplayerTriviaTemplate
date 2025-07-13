import { ActivatedRoute, Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { IonicModule } from '@ionic/angular';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { Lobby } from '../game/lobby';
import { LobbyService } from 'src/app/services/lobby.service';
import { Player } from '../game/player';
import { PlayersCardComponent } from 'src/app/shared/component/players-card/players-card.component';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { addIcons } from 'ionicons';
import { clipboard } from 'ionicons/icons';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, PlayersCardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyPage implements OnInit {
  lobby: Lobby | null = null
  players: Player[] = []

  lobbyCode: string = "";
  playerName: string = "";
  selectedSize = 8

  categoryList: string[] = []
  subcategoryList: string[] = []

  categoryPicked: string | null = null;
  subcategoryPicked: string | null = null;

  isOwner: boolean = false


  unsubscribeLobby: any;
  unsubscribePlayers: any;

  constructor(private route: ActivatedRoute, private router: Router, private userConfigService: UserConfigService, private itemService: ItemFirestoreService, private lobbyService: LobbyService) {
    addIcons({ clipboard })
    lobbyService.cleanLobbyDB()

    this.playerName = this.userConfigService.getConfig()['gameName'];
    this.lobbyCode = this.route.snapshot.paramMap.get('code') ?? ""
    if (!this.lobbyCode) {
      this.router.navigateByUrl('home')
      return
    }
  }

  async ngOnInit() {
    const isCreate = this.router.getCurrentNavigation()?.extras.state?.['isCreate'];
    console.log(this.lobbyCode)
    if (isCreate) {
      if (await this.lobbyService.lobbyAlreadyExist(this.lobbyCode)) {
        this.router.navigateByUrl('home')
        return
      }
      this.lobbyService.createLobby(this.lobbyCode)

    } else {
      if (await this.lobbyService.lobbyDoesNotExist(this.lobbyCode)) {
        this.router.navigateByUrl('home')
        return
      }

      this.lobbyService.joinLobby(this.lobbyCode)
    }


    this.unsubscribeLobby = this.lobbyService.listenLobby(this.lobbyCode, (lobby) => {
      this.lobby = lobby;
    });

    this.unsubscribePlayers = this.lobbyService.listenPlayers(this.lobbyCode, (list) => {
      console.log(list)
      this.players = list;
    });

  }

  ionViewWillLeave() {
    this.lobbyService.leaveLobby(this.lobbyCode)

  }
  ngOnDestroy() {
    this.unsubscribeLobby?.();
    this.unsubscribePlayers?.();
  }


  updateName<T>(): void {
    this.userConfigService.updateConfig('gameName', this.playerName);
    this.lobbyService.changePlayerName(this.lobbyCode, this.playerName)
  }


  copyToClipboard() {
    navigator.clipboard.writeText("https://" + window.location.hostname + this.router.url);
    AppComponent.presentOkToast("Code Copied")
  }
}
