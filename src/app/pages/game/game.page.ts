import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuButton, IonRow, IonSplitPane, IonText, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';

import { AppComponent } from 'src/app/app.component';
import { FormsModule } from '@angular/forms';
import { GameInstance } from 'src/app/services/game.instance';
import { GameState } from 'src/app/shared/DTO/lobby';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { LobbyService } from 'src/app/services/firestore/lobby.service';
import { Player } from 'src/app/shared/DTO/player';
import { PlayersCardComponent } from "src/app/shared/component/players-card/players-card.component";
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserConfigService } from "src/app/services/userconfig.service";
import { distance } from 'fastest-levenshtein';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonListHeader, IonList, IonChip, IonSplitPane, IonItem, IonInput, IonLabel, IonCardSubtitle, IonCardTitle, IonCardHeader, IonButton, IonCardContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonContent, IonCard, PlayersCardComponent, IonMenu]
})
export class GamePage implements OnInit, OnDestroy, AfterViewInit {
  GameState = GameState
  get gameInstance(): GameInstance { return AppComponent.gameInstance }
  set gameInstance(value: GameInstance) { AppComponent.gameInstance = value }

  trivia: TriviaItemDTO | null = null;
  userAnswer: string = '';

  answerIsCorrect = false;

  private stateSub?: Subscription;
  private allReadySub?: Subscription;

  constructor(private lobbyService: LobbyService, private userConfigService: UserConfigService, private itemFirestoreService: ItemFirestoreService, private location: Location, private router: Router) { }


  ngOnInit() {
    this.stateSub = this.gameInstance.getGameStateListener().subscribe(state => this.onStateChange(state))
    this.allReadySub = this.gameInstance.getAllPlayerReadyListener().subscribe(() => this.onAllPlayerReady())
  }

  ngAfterViewInit() {

  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
    this.allReadySub?.unsubscribe();
  }


  async loadCurrentQuestion(): Promise<void> {
    this.trivia = null;

    const instance = this.gameInstance;
    const remaining = instance.lobby!.questionCount;

    if (remaining <= 0) {
      console.warn("No more question");
      return;
    }

    const questionId = instance.lobby!.questionList[remaining - 1];
    this.trivia = await this.itemFirestoreService.getItem(questionId);
  }

  onStateChange(state: GameState): void {
    if (state === GameState.GameQuestion) {
      this.answerIsCorrect = false;
      this.userAnswer = ''
      this.loadCurrentQuestion();

      if (this.gameInstance.lobby.isTimed && this.gameInstance.isOwner) {
        const duration = this.gameInstance.lobby.timerDuration;
        this.startCountdown(duration);
      }
      return
    }

    if (state === GameState.GameAnswer) {
      const audio = new Audio('assets/Sound/trombone.wav');
      audio.play();
      this.clearCountdown();
      return
    }
  }

  onAllPlayerReady() {
    if (this.gameInstance.lobby.state === GameState.GameQuestion)
      this.onNextPressed()
  }

  onNextPressed(): void {
    console.log("Next was asked")
    const lobby = this.gameInstance.lobby;
    const code = this.gameInstance.lobbyCode;

    if (lobby.state === GameState.GameQuestion) {
      this.lobbyService.updateLobby(code, 'state', GameState.GameAnswer);
      return
    }

    if (lobby.state === GameState.GameAnswer) {
      this.lobbyService.advanceToNextQuestion(code)
      return
    }
  }


  //#region Countdown
  countdown: number = 0;
  countdownInterval: any;

  startCountdown(duration: number): void {
    this.countdown = duration;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.lobbyService.updateLobby(this.gameInstance.lobbyCode, 'secondsRemaining', this.countdown);

      if (this.countdown <= 0) {
        this.clearCountdown();
        this.onNextPressed()
      }
    }, 1000);
  }


  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
  //#endregion


  //#region Answer
  submitAnswer(): void {
    const trimmed = this.userAnswer.trim();
    if (!trimmed) return
    if (this.answerIsCorrect) {
      this.triggerFloatingAnswer(true)
      return
    }

    this.answerIsCorrect = this.checkAnswer(trimmed);

    if (this.answerIsCorrect) {
      this.lobbyService.playerFoundAnswer(this.gameInstance.lobbyCode);
      this.triggerFloatingAnswer(true)
    } else {
      this.triggerFloatingAnswer(false)
    }
  }

  floatingAnswerList: { id: number; left: string; correct: boolean }[] = [];
  private nextAnswerId = 0;

  triggerFloatingAnswer(correct: boolean): void {
    const randomLeft = Math.floor(Math.random() * 80) + 10;
    const id = this.nextAnswerId++;

    this.floatingAnswerList.push({
      id,
      left: `${randomLeft}%`,
      correct
    });

    setTimeout(() => {
      this.floatingAnswerList = this.floatingAnswerList.filter(msg => msg.id !== id);
    }, 1500);
  }

  checkAnswer(answer: string): boolean {
    if (!this.trivia) return false;

    function removeAccents(str: string): string {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const userInput = removeAccents(answer.toLowerCase());
    const correct = removeAccents(this.trivia.answer.toLowerCase());

    if (this.gameInstance.lobby.answerStrictness === 0)
      return userInput === correct;
    else {
      const dist = distance(userInput, correct);
      return dist <= this.gameInstance.lobby.answerStrictness
    }
  }

  //#endregion

  //#region EndGame
  getPlayerScore(): number {
    const player = this.gameInstance.players.find(p => p.id === this.gameInstance.playerId);
    return player?.score ?? 0;
  }
  getPlayerRank(): number {
    const sorted = [...this.gameInstance.players].sort((a, b) => b.score - a.score);
    return sorted.findIndex(p => p.id === this.gameInstance.playerId) + 1;
  }

  sortedPlayers(): Player[] {
    return [...this.gameInstance.players].sort((a, b) => b.score - a.score);
  }

  goBack(): void {
    this.location.historyGo(-2);
  }

  //#endregion
}

