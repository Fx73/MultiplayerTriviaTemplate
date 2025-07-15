export class Lobby {
    host: string | null = null
    category: string | null = null
    subcategory: string | null = null
    questionCount: number = 10
    isTimed: boolean = true
    timerDuration = 60
    answerStrictness = 0
    createdAt: Date = new Date()
    state: GameState = GameState.InLobby;
    questionList: string[] = []
    secondsRemaining: number = 0
    systemMessage?: string;

    constructor() {
    }
}

export enum GameState {
    InLobby,
    GameQuestion,
    GameAnswer,
    InVictoryRoom
}
