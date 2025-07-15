import { Component, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonItem, IonLabel, IonMenu, IonSearchbar, IonSelect, IonSelectOption, IonSplitPane, IonTextarea } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "src/app/shared/component/header/header.component";
import { ItemFirestoreService } from 'src/app/services/firestore/item.firestore.service';
import { Router } from '@angular/router';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './../../services/firestore/user.firestore.service';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonTextarea, IonButton, IonSplitPane, IonCardSubtitle, IonMenu, IonCardContent, IonCardTitle, IonInfiniteScrollContent, IonInfiniteScroll, IonSearchbar, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonInput, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class BrowsePage implements OnInit {
  searchQuery: string = '';
  items: TriviaItemDTO[] = [];

  categoryList: string[] = []
  subcategoryList: string[] = []
  ownerNameList: Map<string, string> = new Map()

  selectedItem: TriviaItemDTO | null = null;
  selectedCategoryChoice: string | null = null;
  selectedSubcategoryChoice: string | null = null;

  userId: string | undefined

  constructor(private itemFirestoreService: ItemFirestoreService, private userFirestoreService: UserFirestoreService, private userConfigService: UserConfigService) {
    this.userId = userFirestoreService.getUserData()?.id
  }

  ngOnInit() {
    this.itemFirestoreService.getCategories().then(value => this.categoryList = value);
    this.updateItems(null, true);

  }

  async updateItems(lastItemId: string | null, resetList = false) {
    const newItems: TriviaItemDTO[] = await this.itemFirestoreService.GetAllItems(lastItemId, this.searchQuery);

    if (resetList)
      this.items = newItems
    else
      this.items = this.items.concat(newItems)

    const ownerIds = Array.from(new Set(
      this.items.map(item => item.owner).filter(id => id !== undefined)
    )) as string[];

    this.updateOwnerMap(ownerIds)
  }

  async updateOwnerMap(newOwnerIds: string[]): Promise<void> {
    const missingIds = newOwnerIds.filter(id => !this.ownerNameList.has(id));
    if (missingIds.length > 0) {
      const freshMap = await this.userFirestoreService.getUserNameMap(missingIds);
      freshMap.forEach((name, id) => {
        this.ownerNameList.set(id, name);
      });
    }
  }

  async onCategorySelect() {
    if (!this.selectedCategoryChoice) {
      this.selectedItem!.category = undefined;
      this.subcategoryList = [];
    } else {
      if (this.selectedCategoryChoice === '__custom__') {
        this.selectedItem!.category = '';
        this.subcategoryList = [];
      } else {
        this.selectedItem!.category = this.selectedCategoryChoice;
        this.subcategoryList = await this.itemFirestoreService.getSubcategories(this.selectedCategoryChoice)
      }
    }
  }

  onSubcategorySelect() {
    if (!this.selectedSubcategoryChoice) {
      this.selectedItem!.subcategory = undefined;
    } else {
      if (this.selectedSubcategoryChoice === '__custom__') {
        this.selectedItem!.subcategory = '';
      } else {
        this.selectedItem!.subcategory = this.selectedSubcategoryChoice;
      }
    }
  }

  onAddNewItem() {
    this.selectedItem = new TriviaItemDTO();
  }

  async onUploadItem() {
    if (!this.selectedItem) return
    await this.itemFirestoreService.uploadItem(this.selectedItem)

    this.items.push(this.selectedItem);
    const newCategory = this.selectedItem.category;
    if (newCategory && !this.categoryList.includes(newCategory))
      this.categoryList.push(newCategory);

    this.selectedItem = null;
  }

  onSaveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    this.itemFirestoreService.updateItem(this.selectedItem)

  }
  async onRemoveItem() {
    if (!this.selectedItem || !this.selectedItem.owner || this.selectedItem.owner !== this.userId) return
    await this.itemFirestoreService.deleteItem(this.selectedItem.id)

    this.items = this.items.filter(item => item.id !== this.selectedItem?.id);
    this.selectedItem = null;
  }

  select(item: TriviaItemDTO) {
    if (this.selectedItem?.id === item.id) {
      this.selectedItem = null;
      return;
    }
    this.selectedItem = item;
    this.selectedCategoryChoice = item.category ?? null
    if (this.selectedCategoryChoice) {
      this.itemFirestoreService.getSubcategories(this.selectedCategoryChoice).then(value => this.subcategoryList = value)
      this.selectedSubcategoryChoice = item.subcategory ?? null
    }
  }


  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.updateItems(null, true)
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    this.updateItems(this.items.at(-1)?.id ?? null)
  }


}
