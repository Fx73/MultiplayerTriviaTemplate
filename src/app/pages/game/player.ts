export class Player {
    id: string = ""
    name: string = "MisterDefault"
    score = 0
    isReady = false

    constructor(id: string, name: string) {
        this.id = id
        this.name = name
    }
}