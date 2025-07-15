import { AppComponent } from 'src/app/app.component';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameGuard {

  constructor(private router: Router) { }

  canActivate(): boolean {
    if (!AppComponent.gameInstance || !AppComponent.gameInstance.lobbyCode || !AppComponent.gameInstance.lobby) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
