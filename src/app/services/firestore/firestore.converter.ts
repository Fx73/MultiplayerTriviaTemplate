import { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export class FirestoreConverter<T extends object> {
    readonly IGNORE_UNDEFINED: boolean = true
    readonly IGNORED_FIELDS: Set<string> = new Set(["additionalFields"])
    readonly type;

    constructor(type: { new(): T; }) {
        this.type = type
    }

    toFirestore(dto: T): DocumentData {
        return this.toFirestoreRecurse(dto)
    }

    toFirestoreRecurse(dto: any): DocumentData {
        const data: DocumentData = {};
        Object.keys(dto).forEach((key) => {
            const value = Reflect.get(dto, key);
            if (this.IGNORED_FIELDS.has(key)) {
                // Well ... ignore
            }
            else if (value === undefined) {
                if (!this.IGNORE_UNDEFINED) data[key] = null
            }
            else if (Array.isArray(value))
                data[key] = value.map(v => Object(v) === v ? this.toFirestoreRecurse(v) : v)
            else if (value instanceof Date)
                data[key] = value
            else if (Object(value) === value)
                data[key] = this.toFirestoreRecurse(value)
            else
                data[key] = value
        });
        return data
    }

    fromFirestore(snapshot: QueryDocumentSnapshot<any>): T {
        const data = snapshot.data();
        const dto = new this.type()
        return this.fromFirestoreRecurse(data, dto) as T;
    }
    fromFirestoreRecurse(data: any, dto?: any): any {
        if (dto === undefined)
            dto = {}
        Object.keys(data as object).forEach((key) => {
            let value = data[key]
            if (Array.isArray(value))
                value = this.mapArrayRecurse(value)
            else if (value instanceof Timestamp)
                value = value.toDate()
            else if (Object(value) === value)
                value = this.fromFirestoreRecurse(value)

            Reflect.set(dto, key, value)
        });
        return dto;
    }

    mapArrayRecurse(array: any[]): any[] {
        // Is empty or primitive
        if (array.length === 0 || Object(array[0]) !== array[0])
            return array

        // Is poorly Converted Array
        if (Object.keys(array[0]).every((x, index) => Number(x) === index))
            return array.map(x => this.mapArrayRecurse(Object.values(x)))

        // Is Object
        return array.map(x => this.fromFirestoreRecurse(x))
    }

}

export class SimpleFirestoreConverter<T extends object> {
    readonly type;
    readonly IGNORE_UNDEFINED: boolean = true
    readonly IGNORED_FIELDS: Set<string> = new Set(["additionalFields"])

    constructor(type: { new(): T; }) {
        this.type = type
    }


    toFirestore(dto: T): DocumentData {
        const data: DocumentData = {};
        Object.keys(dto as object).forEach((key) => {
            if (!this.IGNORED_FIELDS.has(key)) {
                const value = Reflect.get(dto, key);
                if (!this.IGNORE_UNDEFINED || value !== undefined) {
                    data[key] = value;
                }
            }
        });
        return data;
    }


    fromFirestore(snapshot: QueryDocumentSnapshot<T>): T {
        const data = snapshot.data();
        const dto = new this.type()
        Object.keys(data as object).forEach((key) => {
            Reflect.set(dto, key, data[key as keyof T]);
        });
        return dto;
    }
}