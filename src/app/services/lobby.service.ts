import { Observable, ReplaySubject, Subject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  private playersSubject = new Subject<any>();
  private ownerSubject = new Subject<void>();

  public roundSubject$ = new ReplaySubject<any>(1);
  public voteSubject$ = new Subject<any>();
  public endSubject$ = new Subject<any>();


  constructor(private socket: Socket) {
    this.listenPlayers((value: any) => this.playersSubject.next(value.players))
    this.listenOwner(() => this.ownerSubject.next())
    this.listenRound((value: any) => { this.roundSubject$.next(value) })
    this.listenVotes((value: any) => { this.voteSubject$.next(value) })
    this.listenEnd((value: any) => { this.endSubject$.next(value) })

  }



  //#region "Common"
  /**
   * LISTENERS
   */
  private listenPlayers(callbackFn: Function) {
    this.socket.on("players", callbackFn)
  }
  observePlayers(): Observable<any> {
    return this.playersSubject.asObservable()
  }

  private listenOwner(callbackFn: Function) {
    this.socket.on("owner", callbackFn)
  }
  observeOwner() {
    return this.ownerSubject.asObservable()
  }

  listenErrors(callbackFn: Function) {
    this.socket.on("error", callbackFn)
  }
  //#endregion


  //#region "Lobby"
  /**
   * CALLERS
   */
  create(username: string, callbackFn: Function) {
    this.socket.on("create", callbackFn)
    this.socket.emit('create', { name: username })
  }

  join(code: string, username: string, callbackFn: Function) {
    this.socket.on('join', callbackFn)
    this.socket.emit('join', { name: username, id: code })
  }

  changeName(name: string) {
    this.socket.emit('changeName', { name: name })
  }

  pickTournament(t: any, size: number) {
    this.socket.emit('setOptions', { tournament: { id: t.id }, size: size })
  }

  leave() {
    this.socket.emit('leave')
  }

  launch() {
    this.socket.emit('launch')
  }

  /**
   * LISTENERS
   */
  listenTournament(callbackFn: Function) {
    this.socket.on("tournament", callbackFn)
  }

  listenStart(callbackFn: Function) {
    this.socket.on("start", callbackFn)
  }

  //#endregion



  //#region "Game"
  /**
   * CALLERS
   */

  vote(left: boolean, callbackFn: Function) {
    this.socket.on("voted", callbackFn)
    this.socket.emit('vote', { left: left })
  }

  skip() {
    this.socket.emit('skip')
  }

  /**
   * LISTENERS
   */

  private listenRound(callbackFn: Function) {
    this.socket.on("round", callbackFn)
  }
  observeRound() {
    return this.roundSubject$.asObservable()
  }
  observeVote() {
    return this.voteSubject$.asObservable()
  }
  observeEnd() {
    return this.endSubject$.asObservable()
  }

  listenVotes(callbackFn: Function) {
    this.socket.on("vote", callbackFn)
  }

  listenEnd(callbackFn: Function) {
    this.socket.on('end', callbackFn)
  }


  //#endregion

}
