import { Firestore, QueryConstraint, collection, deleteDoc, deleteField, doc, documentId, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';

import { AppComponent } from 'src/app/app.component';
import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';
import { TriviaItemDTO } from 'src/app/shared/DTO/trivia-item.dto';
import { UserFirestoreService } from './user.firestore.service';

@Injectable({
    providedIn: 'root'
})
export class ItemFirestoreService {
    //#region Constants
    readonly TRIVIA_COLLECTION = "trivia"
    readonly METADATA_COLLECTION = "metadata"
    readonly CATEGORY_DOCUMENT = "categories"
    readonly BATCH_SIZE = 60;
    readonly firestoreConverterTriviaItem = new FirestoreConverter<TriviaItemDTO>(TriviaItemDTO)
    //#endregion
    db: Firestore

    constructor(private userFirestoreService: UserFirestoreService) {
        this.db = getFirestore()
    }


    //#region Items
    async uploadItem(dto: TriviaItemDTO): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");
            dto.owner = userId

            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, dto.id).withConverter(this.firestoreConverterTriviaItem);
            await setDoc(itemRef, dto);

            AppComponent.presentOkToast("Trivia successfully uploaded!")


        } catch (error) {
            dto.owner = undefined
            AppComponent.presentWarningToast("Error uploading music: " + error)
            throw error;
        }
    }

    async updateItem(dto: TriviaItemDTO): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, dto.id).withConverter(this.firestoreConverterTriviaItem);
            const oldSnap = await getDoc(itemRef);
            const oldData = oldSnap.data();

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
                AppComponent.presentWarningToast(`Document ${documentId} does not exist!`);
                return null;
            }
        } catch (error) {
            AppComponent.presentErrorToast('Error retrieving item: ' + error);
            throw error;
        }
    }

    async GetAllOwnedItems(): Promise<TriviaItemDTO[]> {
        const userId = this.userFirestoreService.getUserData()?.id;

        const items: TriviaItemDTO[] = [];
        const itemRef = collection(this.db, this.TRIVIA_COLLECTION).withConverter(this.firestoreConverterTriviaItem);

        const q = query(
            itemRef,
            where('owner', '==', userId),
            orderBy(documentId())
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            items.push(doc.data());
        });

        return items;
    }

    async GetAllItems(lastItemId: string | null, selectedCategories: string[] = [], searchTerm?: string): Promise<TriviaItemDTO[]> {
        const itemRef = collection(this.db, this.TRIVIA_COLLECTION).withConverter(this.firestoreConverterTriviaItem);
        const constraints: QueryConstraint[] = [];

        // 🔍 Optional title-based search
        if (searchTerm) {
            constraints.push(where('answer', '>=', searchTerm));
            constraints.push(where('answer', '<', searchTerm + 'z'));
        }

        // 🗂️ Optional category filter
        if (selectedCategories.length > 0) {
            // Firestore 'in' supports max 10 values
            constraints.push(where('category', 'in', selectedCategories.slice(0, 10)));
        }

        // 📍 Pagination setup
        constraints.push(orderBy('answer'));
        if (lastItemId) constraints.push(startAfter(lastItemId));
        constraints.push(limit(this.BATCH_SIZE));

        const q = query(itemRef, ...constraints);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("No more items to fetch");
        }

        return querySnapshot.docs.map(doc => doc.data());
    }




    async deleteItem(itemId: string): Promise<void> {
        try {
            const itemRef = doc(this.db, this.TRIVIA_COLLECTION, itemId);
            const itemSnap = await getDoc(itemRef);

            if (!itemSnap.exists()) {
                throw new Error('Item not found');
            }

            const itemData = itemSnap.data();
            const category = itemData['category'];

            await deleteDoc(itemRef);
            AppComponent.presentOkToast("Item successfully deleted!");

        } catch (error) {
            AppComponent.presentErrorToast("Error deleting item: " + error);
            throw error;
        }
    }


    //#endregion

    //#region Category

    async getCategories(): Promise<string[]> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        const snap = await getDoc(ref);

        const data = snap.data();

        return data?.['category'];
    }


    async addCategory(name: string): Promise<boolean> {
        const cleaned = name?.trim();
        if (!cleaned || cleaned.length === 0) {
            AppComponent.presentErrorToast('Category is required and cannot be empty.');
            return false;
        }

        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        const snap = await getDoc(ref);
        const existing = snap.data()?.['category'];

        let categories: string[] = Array.isArray(existing) ? existing : [];

        if (categories.includes(cleaned)) {
            AppComponent.presentErrorToast(`⚠️ Category "${cleaned}" already exists.`);
            return false;
        }

        categories.push(cleaned);

        await setDoc(ref, { category: categories }, { merge: true });
        AppComponent.presentOkToast(`✅ Category added: ${cleaned}`);
        return true
    }


    async removeCategory(category: string): Promise<void> {
        const triviaSnap = await getDocs(collection(this.db, 'trivia'));
        const stillUsed = triviaSnap.docs.some(doc => {
            const data = doc.data();
            return data['category'] === category;
        });

        if (stillUsed) {
            console.log(`Category "${category}" is still in use`);
            return;
        }

        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        await updateDoc(ref, {
            [`category.${category}`]: deleteField()
        });
    }


    //#endregion

    //#region Game
    async getRandomQuestionIds(count: number, category: string[] = []): Promise<string[]> {
        let queryRef = collection(this.db, this.TRIVIA_COLLECTION);

        const constraints: QueryConstraint[] = [];

        if (category && category.length > 0)
            constraints.push(where('category', 'in', category));

        //Todo : Scale
        const querySnapshot = await getDocs(query(queryRef, ...constraints));
        const allIds = querySnapshot.docs.map(doc => doc.id);


        const shuffled = allIds.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    //#endregion
}

