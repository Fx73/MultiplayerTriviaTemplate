import { Injectable } from '@angular/core';
import { LobbyPage } from 'src/app/pages/lobby/lobby.page';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameGuard {

  constructor(private router: Router) { }

  canActivate(): boolean {
    if (LobbyPage.tournamentPicked === null) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
