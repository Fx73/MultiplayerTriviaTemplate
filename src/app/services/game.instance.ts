import { BehaviorSubject, Observable, Subject } from "rxjs"
import { GameState, Lobby } from "../shared/DTO/lobby"

import { AppComponent } from "../app.component"
import { LobbyService } from "./firestore/lobby.service"
import { Player } from "../shared/DTO/player"

export class GameInstance {

    lobbyCode: string
    lobby: Lobby = new Lobby()

    playerId: string
    public playerName: string

    players: Player[] = []

    unsubscribeLobby: any;
    unsubscribePlayers: any;

    private gameStateSubject$ = new BehaviorSubject<GameState>(GameState.InLobby);
    private allPlayersReadySubject$ = new Subject<void>();


    constructor(lobbyCode: string, playerId: string, playerName: string, private lobbyService: LobbyService) {
        this.lobbyCode = lobbyCode
        this.playerId = playerId
        this.playerName = playerName
    }

    get isOwner(): boolean { return this.lobby.host === this.playerId }

    public getGameStateListener(): Observable<GameState> {
        return this.gameStateSubject$.asObservable();
    }
    public getAllPlayerReadyListener(): Observable<void> {
        return this.allPlayersReadySubject$.asObservable();
    }

    listenToLobby() {
        this.unsubscribeLobby = this.lobbyService.listenLobby(this.lobbyCode, this.onChangeInLobby.bind(this));
        this.unsubscribePlayers = this.lobbyService.listenPlayers(this.lobbyCode, this.onChangeInPlayers.bind(this));
    }

    onChangeInLobby(newLobby: Lobby) {
        console.log('Lobby received :', newLobby);

        const previousState = this.lobby?.state;
        const previousMessage = this.lobby?.systemMessage;

        this.lobby = newLobby;

        if (previousState !== newLobby.state) {
            this.gameStateSubject$.next(newLobby.state);
        }

        if (newLobby.systemMessage && newLobby.systemMessage !== previousMessage) {
            AppComponent.presentPrimaryToast(newLobby.systemMessage);
        }
    }


    onChangeInPlayers(newPlayers: Player[]) {
        console.log('Player received :', newPlayers);

        const currentReadyCount = this.players.filter(p => p.isReady).length;
        const newReadyCount = newPlayers.filter(p => p.isReady).length;

        this.players = newPlayers;

        if (newReadyCount > currentReadyCount) {
            const audio = new Audio('assets/Sound/cowbell.wav');
            audio.play();
        }

        const allReady = newPlayers.length > 0 && newPlayers.every(p => p.isReady);
        if (allReady) {
            this.allPlayersReadySubject$.next();
        }
    }


    leaveGame() {
        this.lobbyService.leaveLobby(this.lobbyCode)
        this.lobbyCode = ""
        this.unsubscribeLobby?.();
        this.unsubscribePlayers?.();
    }

    onKickPlayer(playerId: string): void {
        this.lobbyService.kickPlayer(this.lobbyCode, playerId);
    }


}