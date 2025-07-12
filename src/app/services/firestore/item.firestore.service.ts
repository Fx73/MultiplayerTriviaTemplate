import { Firestore, addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';

import { AppComponent } from 'src/app/app.component';
import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';
import { TriviaItemDTO } from 'src/app/DTO/trivia-item.dto';
import { UserFirestoreService } from './user.firestore.service';

@Injectable({
    providedIn: 'root'
})
export class ItemFirestoreService {
    //#region Constants
    readonly TRIVIA_COLLECTION = "trivia"
    readonly BATCH_SIZE = 60;
    readonly firestoreConverterTriviaItem = new FirestoreConverter<TriviaItemDTO>(TriviaItemDTO)
    //#endregion
    db: Firestore

    constructor(private userFirestoreService: UserFirestoreService) {
        this.db = getFirestore()
    }


    async uploadItem(dto: TriviaItemDTO): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, dto.id).withConverter(this.firestoreConverterTriviaItem);
            await setDoc(itemRef, dto);

            AppComponent.presentOkToast("Music successfully uploaded!")
        } catch (error) {
            AppComponent.presentWarningToast("Error uploading music: " + error)
            throw error;
        }
    }

    async updateItem(dto: TriviaItemDTO): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, dto.id).withConverter(this.firestoreConverterTriviaItem);
            await setDoc(itemRef, dto);

            AppComponent.presentOkToast("Item successfully updated!");
        } catch (error) {
            AppComponent.presentWarningToast("Error updating item: " + error);
            throw error;
        }
    }




    async existsItem(itemId: string): Promise<boolean> {
        const docSnap = await getDoc(doc(this.db, this.TRIVIA_COLLECTION, itemId))
        return docSnap.exists();
    }

    async getItem(documentId: string): Promise<TriviaItemDTO | null> {
        try {
            const docRef = doc(this.db, this.TRIVIA_COLLECTION, documentId).withConverter(this.firestoreConverterTriviaItem);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.warn(`Document ${documentId} does not exist!`);
                return null;
            }
        } catch (error) {
            console.error('Error retrieving item:', error);
            throw error;
        }
    }


    async GetAllItems(lastitemId: string | null): Promise<TriviaItemDTO[]> {
        const items: TriviaItemDTO[] = [];
        const itemRef = collection(this.db, this.TRIVIA_COLLECTION).withConverter(this.firestoreConverterTriviaItem);;

        let q;

        if (lastitemId) {
            q = query(
                itemRef,
                orderBy(documentId()),
                startAfter(lastitemId),
                limit(this.BATCH_SIZE)
            );
        } else {
            q = query(
                itemRef,
                orderBy(documentId()),
                limit(this.BATCH_SIZE)
            );
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No more items to fetch");

        querySnapshot.forEach((doc) => {
            items.push(doc.data());
        });

        return items;
    }

    async GetAllItemsWithSearch(lastitemId: string | null, searchTerm: string): Promise<TriviaItemDTO[]> {
        const items: TriviaItemDTO[] = [];
        const itemRef = collection(this.db, this.TRIVIA_COLLECTION).withConverter(this.firestoreConverterTriviaItem);

        let q;
        if (lastitemId) {
            q = query(
                itemRef,
                where('title', ">=", searchTerm),
                where('title', "<", searchTerm + "z"),
                orderBy(documentId()),
                startAfter(lastitemId),
                limit(this.BATCH_SIZE)
            );
        } else {
            q = query(
                itemRef,
                where('title', ">=", searchTerm),
                where('title', "<", searchTerm + "z"),
                orderBy(documentId()),
                limit(this.BATCH_SIZE)
            );
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No more items to fetch");

        querySnapshot.forEach((doc) => {
            items.push(doc.data());
        });

        return items;
    }



    async deleteItem(itemId: string): Promise<void> {
        try {
            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, itemId);
            await deleteDoc(itemRef);
            AppComponent.presentOkToast("Item successfully deleted!");
        } catch (error) {
            AppComponent.presentErrorToast("Error deleting music: " + error);
            throw error;
        }
    }

}

