import { Component, Input } from '@angular/core';

import { PopoverController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { UserComponent } from '../../user/user.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [RouterModule, UserComponent, RouterModule]
})
export class HeaderComponent {

  @Input()
  title: string = "Welcome";

  constructor(public popoverController: PopoverController) { }




}

