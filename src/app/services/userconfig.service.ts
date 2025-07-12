import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserFirestoreService } from './firestore/user.firestore.service';

@Injectable({
    providedIn: 'root',
})
export class UserConfigService {
    //#region Constants
    private readonly CONFIG_STORAGE_KEY = "userConfig"
    //#endregion

    private configSubject: BehaviorSubject<UserConfig> = new BehaviorSubject<UserConfig>(new UserConfig());
    config$ = this.configSubject.asObservable();


    constructor(private userFirestoreService: UserFirestoreService) {
        const storedConfig: UserConfig = JSON.parse(localStorage.getItem(this.CONFIG_STORAGE_KEY) || '{}');
        const defaultConfig = new UserConfig();

        this.configSubject = new BehaviorSubject<UserConfig>({ ...defaultConfig, ...storedConfig });


    }



    getConfig(): { [key: string]: any } {
        return this.configSubject.value;
    }



    updateConfig(option: keyof UserConfig, value: any): void {
        if (!(option in this.configSubject.value)) {
            console.error(`Invalid option  : ${option}`);
            return;
        }

        const updatedConfig = { ...this.configSubject.value, [option]: value };
        this.configSubject.next(updatedConfig);

        localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.configSubject.value));
    }


    resetToDefault(): void {
        localStorage.removeItem(this.CONFIG_STORAGE_KEY);

    }

}

class UserConfig {
    gameName = "MisterDefault"


}