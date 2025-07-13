import { Routes } from '@angular/router';
import { UserGuard } from './shared/guard/user.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'lobby/:code',
    loadComponent: () => import('./pages/lobby/lobby.page').then(m => m.LobbyPage)
  },
  {
    path: 'game',
    loadComponent: () => import('./pages/game/game.page').then(m => m.GamePage)
  },
  {
    path: 'options',
    loadComponent: () => import('./pages/options/options.page').then(m => m.OptionsPage)
  },
  {
    path: 'browse',
    loadComponent: () => import('./pages/browse/browse.page').then(m => m.BrowsePage),
  },
  {
    path: 'user-profile',
    loadComponent: () => import('./pages/user-profile/user-profile.page').then(m => m.UserProfilePage),
    canActivate: [UserGuard]
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage)
  },
];
