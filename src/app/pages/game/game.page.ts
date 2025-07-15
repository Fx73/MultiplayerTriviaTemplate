import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonMenu, IonMenuButton, IonSplitPane, IonText, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';

import { AppComponent } from 'src/app/app.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameInstance } from 'src/app/services/game.instance';
import { GameState } from 'src/app/shared/DTO/lobby';
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { LobbyService } from 'src/app/services/firestore/lobby.service';
import { PlayersCardComponent } from "src/app/shared/component/players-card/players-card.component";
import { Subscription } from 'rxjs';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserConfigService } from "src/app/services/userconfig.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonChip, IonSplitPane, IonItem, IonInput, IonLabel, IonCardSubtitle, IonCardTitle, IonCardHeader, IonButton, IonCardContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonContent, IonCard, PlayersCardComponent, IonMenu]
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

  constructor(private lobbyService: LobbyService, private userConfigService: UserConfigService, private itemFirestoreService: ItemFirestoreService, private toastController: ToastController) { }


  ngOnInit() {
    this.stateSub = this.gameInstance.getGameStateListener().subscribe(state => this.onStateChange(state))
    this.allReadySub = this.gameInstance.getAllPlayerReadyListener().subscribe(() => this.onNextPressed())
  }

  ngAfterViewInit() {

  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
    this.allReadySub?.unsubscribe();
  }


  async loadCurrentQuestion(): Promise<void> {
    const instance = this.gameInstance;
    const remaining = instance.lobby!.questionCount;

    if (remaining <= 0) {
      console.warn("No more question");
      this.trivia = null;
      return;
    }

    const questionId = instance.lobby!.questionList[remaining - 1];
    this.trivia = await this.itemFirestoreService.getItem(questionId);
  }

  onStateChange(state: GameState): void {
    if (state === GameState.GameQuestion) {
      this.loadCurrentQuestion();

      if (this.gameInstance.lobby.isTimed && this.gameInstance.isOwner) {
        const duration = this.gameInstance.lobby.timerDuration;
        this.startCountdown(duration);
      }
      return
    }

    if (state === GameState.GameAnswer) {
      this.clearCountdown();
      return
    }
  }


  onNextPressed(): void {
    console.log("ok")

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

    const userInput = answer.trim().toLowerCase();
    const correct = this.trivia.answer.trim().toLowerCase();

    return userInput === correct;
  }
  //#endregion
}

