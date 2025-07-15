import { Timestamp } from '@firebase/firestore';

export class Player {
    id: string = ""
    name: string = "MisterDefault"
    score = 0
    isReady = false
    answerOrder = 0
    lastTimeSeen: Timestamp = Timestamp.now();
    isConnected: boolean = true;

    constructor(id: string, name: string) {
        this.id = id
        this.name = name
    }
}