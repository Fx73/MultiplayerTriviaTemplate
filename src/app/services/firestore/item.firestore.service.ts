import { Firestore, QueryConstraint, addDoc, collection, deleteDoc, deleteField, doc, documentId, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';

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

            AppComponent.presentOkToast("Music successfully uploaded!")

            if (dto.category) {
                this.addCategory(dto.category);
                if (dto.subcategory)
                    this.addSubcategory(dto.category, dto.subcategory);
            }
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
            const oldSnap = await getDoc(itemRef);
            const oldData = oldSnap.data();

            await setDoc(itemRef, dto);

            AppComponent.presentOkToast("Item successfully updated!");

            // 🔍 Category
            const oldCat = oldData?.category;
            const newCat = dto.category;

            const oldSub = oldData?.subcategory;
            const newSub = dto.subcategory;

            if (newCat) {
                this.addCategory(newCat);
                if (newSub) this.addSubcategory(newCat, newSub);
            }

            if (oldCat && oldCat !== newCat) {
                this.removeCategory(oldCat);
            }

            if (oldCat && oldSub && (oldSub !== newSub || oldCat !== newCat)) {
                this.removeSubcategory(oldCat, oldSub);
            }
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

    async GetAllItems(lastItemId: string | null, searchTerm?: string): Promise<TriviaItemDTO[]> {
        const itemRef = collection(this.db, this.TRIVIA_COLLECTION).withConverter(this.firestoreConverterTriviaItem);
        const constraints: QueryConstraint[] = [];

        // 🔍 Optional title-based search
        if (searchTerm) {
            constraints.push(where('answer', '>=', searchTerm));
            constraints.push(where('answer', '<', searchTerm + 'z'));
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
            const subcategory = itemData['subcategory'];

            await deleteDoc(itemRef);
            AppComponent.presentOkToast("Item successfully deleted!");

            if (category) {
                if (subcategory)
                    this.removeSubcategory(category, subcategory);
                this.removeCategory(category);
            }
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
        return Object.keys(snap.data()?.['category'] ?? {});
    }
    async getSubcategories(category: string): Promise<string[]> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        const snap = await getDoc(ref);
        return snap.data()?.['category']?.[category] ?? [];
    }

    async addCategory(category: string): Promise<void> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        await setDoc(ref, {
            category: { [category]: [] }
        }, { merge: true });
    }
    async addSubcategory(category: string, subcategory: string): Promise<void> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        const snap = await getDoc(ref);
        const data = snap.data();
        const current = data?.['category']?.[category] ?? [];

        if (!current.includes(subcategory)) {
            const updated = [...current, subcategory];
            await updateDoc(ref, {
                [`category.${category}`]: updated
            });
        }
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
    async removeSubcategory(category: string, subcategory: string): Promise<void> {
        const triviaSnap = await getDocs(collection(this.db, 'trivia'));
        const stillUsed = triviaSnap.docs.some(doc => {
            const data = doc.data();
            return data['category'] === category && data['subcategory'] === subcategory;
        });

        if (stillUsed) {
            console.log(`Subcategory "${subcategory}" of "${category}" is still in use`);
            return;
        }

        const ref = doc(this.db, this.METADATA_COLLECTION, this.CATEGORY_DOCUMENT);
        const snap = await getDoc(ref);
        const data = snap.data();
        const current = data?.['category']?.[category] ?? [];

        const updated = current.filter((item: string) => item !== subcategory);
        await updateDoc(ref, {
            [`category.${category}`]: updated
        });
    }

    //#endregion

    //#region Game
    async getRandomQuestionIds(count: number, category: string | null = null, subcategory: string | null = null): Promise<string[]> {
        let queryRef = collection(this.db, this.TRIVIA_COLLECTION);

        const constraints: QueryConstraint[] = [];

        if (category)
            constraints.push(where('category', '==', category));

        if (subcategory)
            constraints.push(where('subcategory', '==', subcategory));


        //Todo : Scale
        const querySnapshot = await getDocs(query(queryRef, ...constraints));
        const allIds = querySnapshot.docs.map(doc => doc.id);


        const shuffled = allIds.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    //#endregion
}

