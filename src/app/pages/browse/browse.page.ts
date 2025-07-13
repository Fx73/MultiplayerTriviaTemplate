import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonMenu, IonSearchbar, IonSplitPane } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { Router } from '@angular/router';
import { TriviaItemDTO } from 'src/app/DTO/trivia-item.dto';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonButton, IonSplitPane, IonCardSubtitle, IonMenu, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonInfiniteScroll, IonSearchbar, IonCard, IonCardHeader, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {
  searchQuery: string = '';
  items: TriviaItemDTO[] = [];
  owneditems: TriviaItemDTO[] = [];

  selectedItem: TriviaItemDTO | null = null;

  userId: string | undefined

  constructor(private itemFirestoreService: ItemFirestoreService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService) {
    this.userId = userFirestoreService.getUserData()?.id
  }

  ngOnInit() {
    this.itemFirestoreService.GetAllOwnedItems().then(value => this.owneditems = value);
    this.itemFirestoreService.GetAllItems(null).then(value => this.items = value);
  }

  onAddNewItem() {
    this.selectedItem = new TriviaItemDTO();
  }

  onUploadItem() {
    if (!this.selectedItem) return
    this.itemFirestoreService.uploadItem(this.selectedItem)

  }

  onSaveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    this.itemFirestoreService.updateItem(this.selectedItem)

  }
  onRemoveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    this.itemFirestoreService.deleteItem(this.selectedItem.id)
  }

  select(item: TriviaItemDTO) {
    if (this.selectedItem?.id === item.id) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = item;
  }


  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.itemFirestoreService.GetAllItemsWithSearch(null, this.searchQuery).then(value => this.items = value);
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    const lastItem: TriviaItemDTO = this.items.at(-1)!
    if (this.searchQuery === '')
      this.itemFirestoreService.GetAllItems(lastItem?.id ?? null).then(value => this.items = this.items.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
    else
      this.itemFirestoreService.GetAllItemsWithSearch(lastItem?.id ?? null, this.searchQuery).then(value => this.items = this.items.concat(value)).catch((e) => { console.log(e.message); event.target.complete() });
  }


}
