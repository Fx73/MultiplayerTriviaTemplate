import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { firebaseConfig } from './app.config';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { routes } from './app/app.routes';

if (environment.production) {
  enableProdMode();
}

const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
const db = getFirestore(firebaseApp);


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
