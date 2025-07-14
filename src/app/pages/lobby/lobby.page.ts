import { ActivatedRoute, Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { IonicModule } from '@ionic/angular';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { Lobby } from '../../shared/DTO/lobby';
import { LobbyService } from 'src/app/services/lobby.service';
import { Player } from '../../shared/DTO/player';
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

  lobbyCode: string;
  playerName: string;
  playerId: string
  selectedSize = 8

  categoryList: string[] = []
  subcategoryList: string[] = []

  questionCount: number = 10;

  get isOwner(): boolean { return this.lobby?.host === this.playerId }


  unsubscribeLobby: any;
  unsubscribePlayers: any;

  constructor(private route: ActivatedRoute, private router: Router, private userConfigService: UserConfigService, private itemService: ItemFirestoreService, private lobbyService: LobbyService) {
    addIcons({ clipboard })
    lobbyService.cleanLobbyDB()

    this.playerName = this.userConfigService.getConfig()['gameName'];
    this.playerId = this.userConfigService.getConfig()['playerId'];

    this.lobbyCode = this.route.snapshot.paramMap.get('code') ?? ""
    if (!this.lobbyCode) {
      this.router.navigateByUrl('home')
      return
    }
  }

  async ngOnInit() {
    const isCreate = this.router.getCurrentNavigation()?.extras.state?.['isCreate'];
    if (isCreate) {
      if (await this.lobbyService.lobbyAlreadyExist(this.lobbyCode)) {
        AppComponent.presentWarningToast("This lobby already exist")
        this.router.navigateByUrl('home')
        return
      }
      this.lobbyService.createLobby(this.lobbyCode)

    } else {
      if (await this.lobbyService.lobbyDoesNotExist(this.lobbyCode)) {
        AppComponent.presentWarningToast("This lobby does not exist")
        this.router.navigateByUrl('home')
        return
      }

      this.lobbyService.joinLobby(this.lobbyCode)
    }


    this.unsubscribeLobby = this.lobbyService.listenLobby(this.lobbyCode, (lobby) => {
      console.log('Lobby received :', lobby)
      this.lobby = lobby;
    });

    this.unsubscribePlayers = this.lobbyService.listenPlayers(this.lobbyCode, (list) => {
      console.log('PlayerList received :', list)
      this.players = list;
    });

    this.categoryList = await this.itemService.getCategories()
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


  async onCategorySelect() {
    if (!this.lobby) return
    await this.lobbyService.updateLobby(this.lobbyCode, 'category', this.lobby.category)
    if (this.lobby.category)
      this.subcategoryList = await this.itemService.getSubcategories(this.lobby.category)
  }
  async onSubcategorySelect() {
    if (!this.lobby) return
    await this.lobbyService.updateLobby(this.lobbyCode, 'subcategory', this.lobby.subcategory)
  }
  async onQuestionCountChange() {
    await this.lobbyService.updateLobby(this.lobbyCode, 'questionCount', this.questionCount)
  }

  onKickPlayerFromLobby(playerId: string): void {
    this.lobbyService.kickPlayer(this.lobbyCode, playerId);
  }


  copyToClipboard() {
    navigator.clipboard.writeText("https://" + window.location.hostname + this.router.url);
    AppComponent.presentOkToast("Code Copied")
  }
}
