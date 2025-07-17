export class TriviaItemDTO {
    get id(): string { return `${this.answer}` }
    category!: string;
    question: string;
    answer: string;
    owner: string | undefined;

    constructor(question?: string, answer?: string) {
        this.question = question ?? ""
        this.answer = answer ?? ""
    }

    validate(): Record<string, string> {
        const errors: Record<string, string> = {};

        if (!this.category || this.category.trim().length === 0) {
            errors['category'] = 'Category is required';
        }

        if (!this.question || this.question.trim().length < 4) {
            errors['question'] = 'Question must be at least 4 characters';
        }

        if (!this.answer || this.answer.trim().length === 0) {
            errors['answer'] = 'Answer is required';
        }

        return errors;
    }
}