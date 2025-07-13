import { Component, Input, OnInit, input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { removeOutline, star } from 'ionicons/icons';

import { IonicModule } from '@ionic/angular';
import { Player } from 'src/app/pages/game/player';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-players-card',
  templateUrl: './players-card.component.html',
  styleUrls: ['./players-card.component.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor],
})

export class PlayersCardComponent implements OnInit {
  @Input()
  ownerName: string = ""

  @Input()
  players: Player[] = []

  @Input()
  isCurrentlyOwner = false

  constructor() {
    addIcons({ star, removeOutline });

  }

  ngOnInit(): void {

  }

}
