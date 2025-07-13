export class Lobby {
    host: string = "Host"
    selectedCategory: string | null = null
    selectedSubcategory: string | null = null
    questionCount: number = 10
    createdAt: Date = new Date()

    constructor(host: string) {
        this.host = host
    }
}