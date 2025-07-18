import { CommonModule, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonIcon, IonInput, IonItem, IonLabel, IonTab, IonTabs, IonTitle } from "@ionic/angular/standalone";
import { keyOutline, logInOutline, logoGoogle, personAddOutline, refreshCircleOutline } from 'ionicons/icons';

import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonInput, IonItem, IonLabel, IonCardSubtitle, IonTab, IonCard, IonButton, IonTabs, IonCardContent, IonCardTitle, IonIcon, IonCardHeader, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NgIf],
})
export class LoginComponent {
  @Input()
  isSmall = false;

  registerForm: FormGroup;
  loginForm: FormGroup;
  passwordRecoveryForm: FormGroup;


  constructor(private fb: FormBuilder, private loginService: LoginFireauthService) {
    addIcons({ keyOutline, logInOutline, personAddOutline, refreshCircleOutline, logoGoogle });

    this.registerForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    });
    this.loginForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    });
    this.passwordRecoveryForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
    });
  }


  register(email: string, password: string): void {
    this.loginService.register(email, password)
  }

  login(email: string, password: string): void {
    this.loginService.login(email, password)
  }

  loginWithGoogle() {
    this.loginService.loginWithGoogle();
  }


  loginWithFacebook() {
    this.loginService.loginWithFacebook();
  }

  passwordRecovery(email: string): void {
    this.passwordRecovery(email);
  }


}
