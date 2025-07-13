export class Lobby {
    host: string = "Host"
    category: string | null = null
    subcategory: string | null = null
    questionCount: number = 10
    createdAt: Date = new Date()

    constructor(host: string) {
        this.host = host
    }
}