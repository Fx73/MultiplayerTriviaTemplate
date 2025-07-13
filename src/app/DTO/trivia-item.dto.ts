export class TriviaItemDTO {
    get id(): string { return `${this.answer}` }
    category: string | undefined;
    subcategory: string | undefined;
    question: string;
    answer: string;
    owner: string | undefined;

    constructor(question?: string, answer?: string) {
        this.question = question ?? ""
        this.answer = answer ?? ""
    }
}