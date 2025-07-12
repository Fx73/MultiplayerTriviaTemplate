export class TriviaItemDTO {
    get id(): string { return `${this.name}` }
    name: string;
    category: string | undefined;
    subcategory: string | undefined;
    question: string;
    answer: string;

    constructor(name?: string, question?: string, answer?: string) {
        this.name = name ?? ""
        this.question = question ?? ""
        this.answer = answer ?? ""
    }
}