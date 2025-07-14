import { Component, EventEmitter, Input, OnInit, Output, input } from '@angular/core';
import { closeCircle, removeOutline, star } from 'ionicons/icons';

import { IonicModule } from '@ionic/angular';
import { Player } from 'src/app/shared/DTO/player';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-players-card',
  templateUrl: './players-card.component.html',
  styleUrls: ['./players-card.component.scss'],
  standalone: true,
  imports: [IonicModule],
})

export class PlayersCardComponent {
  @Input()
  ownerId!: string

  @Input()
  players!: Player[]

  @Input()
  isCurrentlyOwner = false

  @Output() eventKickPlayer = new EventEmitter<string>();



  constructor() {
    addIcons({ star, removeOutline, closeCircle });

  }

  kickPlayer(playerId: string) {
    console.log("trying to kick : ", playerId)
    this.eventKickPlayer.emit(playerId);
  }


}
