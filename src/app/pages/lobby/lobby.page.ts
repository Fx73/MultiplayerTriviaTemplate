import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonRange, IonSelect, IonSelectOption, IonToggle } from "@ionic/angular/standalone";
import { clipboard, helpCircleOutline } from 'ionicons/icons';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameInstance } from './../../services/game.instance';
import { GameState } from '../../shared/DTO/lobby';
import { HeaderComponent } from 'src/app/shared/component/header/header.component';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { LobbyService } from 'src/app/services/firestore/lobby.service';
import { PlayersCardComponent } from 'src/app/shared/component/players-card/players-card.component';
import { Subscription } from 'rxjs';
import { SystemMessageProvider } from 'src/app/shared/system-message-provider';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonLabel, IonSelect, IonRange, IonCardContent, IonContent, IonButton, IonIcon, IonCardTitle, IonCardHeader, IonCard, IonInput, IonToggle, IonItem, CommonModule, FormsModule, HeaderComponent, PlayersCardComponent, IonSelectOption],
})
export class LobbyPage implements OnInit, OnDestroy {
  get gameInstance(): GameInstance { return AppComponent.gameInstance }
  set gameInstance(value: GameInstance) { AppComponent.gameInstance = value }

  lobbyCode: string;

  categoryList: string[] = []

  questionCount: number = 10;

  isLobbyLocked = true;

  private stateSub!: Subscription;

  constructor(private route: ActivatedRoute, private router: Router, private userConfigService: UserConfigService, private itemService: ItemFirestoreService, private lobbyService: LobbyService) {
    addIcons({ clipboard, helpCircleOutline });
    lobbyService.cleanLobbyDB()

    this.lobbyCode = this.route.snapshot.paramMap.get('code') ?? ""
    if (!this.lobbyCode) {
      this.router.navigateByUrl('home')
      return
    }
    if (this.gameInstance && this.gameInstance.lobbyCode && this.gameInstance.lobbyCode != this.lobbyCode) {
      this.gameInstance.leaveGame()
    }

    if (!this.gameInstance || this.gameInstance.lobbyCode != this.lobbyCode) {
      const playerName = this.userConfigService.getConfig()['gameName'];
      const playerId = this.userConfigService.getConfig()['playerId'];
      this.gameInstance = new GameInstance(this.lobbyCode, playerId, playerName, this.lobbyService)
    }

    this.stateSub = this.gameInstance.getGameStateListener().subscribe(state => this.onGameStateChange(state))
  }

  async ngOnInit() {
    const isCreate = this.router.getCurrentNavigation()?.extras.state?.['isCreate'];
    if (isCreate) {
      if (!await this.lobbyService.createLobby(this.lobbyCode)) {
        this.router.navigateByUrl('home')
        return
      }
    }

    if (!await this.lobbyService.joinLobby(this.lobbyCode)) {
      this.router.navigateByUrl('home')
      return
    }
    this.gameInstance.listenToLobby()
    this.categoryList = await this.itemService.getCategories()

  }
  ionViewWillLeave() { }
  ngOnDestroy(): void {
    this.gameInstance.leaveGame()
    this.stateSub?.unsubscribe();
  }

  onGameStateChange(state: GameState) {
    if (state !== GameState.InLobby) {
      this.router.navigate(['/game']);
    }
    else
      this.isLobbyLocked = false;
  }

  updateName<T>(): void {
    this.userConfigService.updateConfig('gameName', this.gameInstance.playerName);
    this.lobbyService.changePlayerName(this.lobbyCode, this.gameInstance.playerName)
  }

  async onLobbyValueModified(key: string, value: any) {
    await this.lobbyService.updateLobby(this.lobbyCode, key, value)
  }

  async onStartPressed() {
    if (!this.gameInstance.lobby) return
    this.isLobbyLocked = true;
    const questions = await this.itemService.getRandomQuestionIds(this.gameInstance.lobby.questionCount, this.gameInstance.lobby.category)

    if (questions.length < this.gameInstance.lobby.questionCount) {
      this.isLobbyLocked = false;

      await this.lobbyService.updateLobby(this.lobbyCode, 'questionCount', questions.length);
      AppComponent.presentWarningToast(`Only ${questions.length} trivia available in that category. Question count updated.`);

      return;
    }

    await this.lobbyService.updateLobby(this.lobbyCode, 'questionList', questions)
    await this.lobbyService.sendSystemMessage(this.lobbyCode, SystemMessageProvider.get('gameStart'));

    // ⏳ Delay before transitioning
    setTimeout(async () => {
      await this.lobbyService.updateLobby(this.lobbyCode, 'state', GameState.GameQuestion);
    }, 2000);
  }


  copyToClipboard() {
    navigator.clipboard.writeText("https://" + window.location.hostname + this.router.url);
    AppComponent.presentOkToast("Code Copied")
  }

  pinFormatter(value: number) {
    return `${value}`;
  }
}
