import { DocumentReference, Firestore, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc } from '@firebase/firestore';
import { Observable, ReplaySubject, Subject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Lobby } from '../shared/DTO/lobby';
import { Player } from '../shared/DTO/player';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './firestore/user.firestore.service';
import { WelcomePage } from '../pages/welcome/welcome.page';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  readonly LOBBY_COLLECTION = "lobby"
  readonly PLAYERS_COLLECTION = "players"

  db: Firestore
  playerId: string
  heartbeatInterval: any;

  constructor(private userConfigService: UserConfigService) {
    this.db = getFirestore()
    this.playerId = "player-" + WelcomePage.generateCode(22)

  }

  //#region "Welcome"
  async lobbyAlreadyExist(lobbyCode: string): Promise<boolean> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);
    return lobbySnap.exists();
  }

  async lobbyDoesNotExist(lobbyCode: string): Promise<boolean> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);
    return !lobbySnap.exists();
  }

  //#endregion


  //#region "Lobby"
  /**
   * CALLERS
   */
  async createLobby(lobbyCode: string): Promise<void> {
    console.log("Creating lobby", lobbyCode)
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobby = new Lobby(this.playerId)
    await setDoc(lobbyRef, { ...lobby });

    const playerName: string = this.userConfigService.getConfig()["gameName"]
    const player = new Player(this.playerId, playerName)
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);
    await setDoc(playerRef, { ...player });

    this.startHeartbeat(lobbyCode)
  }

  async joinLobby(lobbyCode: string): Promise<void> {
    console.log("Joining lobby", lobbyCode)
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const snap = await getDoc(lobbyRef);
    if (!snap.exists()) {
      throw new Error('Lobby does not exist');
    }

    const playerName: string = this.userConfigService.getConfig()["gameName"];
    const player = new Player(this.playerId, playerName);
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);
    const playerSnap = await getDoc(playerRef);
    if (playerSnap.exists()) {
      throw new Error('Player already in lobby');
    }
    await setDoc(playerRef, { ...player });
  }

  async changePlayerName(lobbyCode: string, newName: string): Promise<void> {
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

    const snap = await getDoc(playerRef);
    if (!snap.exists()) {
      throw new Error('Player not present in lobby');
    }

    await updateDoc(playerRef, { name: newName });
  }

  async kickPlayer(lobbyCode: string, targetPlayerId: string): Promise<void> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);

    if (!lobbySnap.exists()) {
      throw new Error('Lobby introuvable');
    }

    const lobbyData = lobbySnap.data();
    if (this.playerId !== lobbyData['host']) {
      throw new Error('Not host');
    }

    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, targetPlayerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      throw new Error('Player does not exist');
    }

    await deleteDoc(playerRef);
  }


  async updateLobby(lobbyCode: string, key: string, value: any): Promise<void> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const snap = await getDoc(lobbyRef);

    if (!snap.exists()) {
      throw new Error('Lobby does not exist');
    }

    await updateDoc(lobbyRef, { [key]: value });
  }



  async leaveLobby(lobbyCode: string): Promise<void> {
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

    const snap = await getDoc(playerRef);
    if (!snap.exists()) {
      throw new Error('Player not present in lobby');
    }
    this.stopHeartbeat()
    await deleteDoc(playerRef);

    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Lobby does not exist')

    if (lobbySnap.data()['host'] === this.playerId) {
      const playersSnap = await getDocs(collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION));
      if (playersSnap.empty) {
        await deleteDoc(lobbyRef);
      } else {
        const newHostId = playersSnap.docs[0].id;
        await updateDoc(lobbyRef, { host: newHostId });
      }
    }
  }


  launchGame() {

  }

  /**
   * LISTENERS
   */
  listenPlayers(lobbyCode: string, callback: (players: Player[]) => void): () => void {
    const playersRef = collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION);

    return onSnapshot(playersRef, (snapshot) => {
      const updated = snapshot.docs.map(doc => doc.data() as Player);
      callback(updated);
    });
  }



  listenLobby(lobbyCode: string, callback: (lobby: Lobby) => void): () => void {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);

    return onSnapshot(lobbyRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        const hydrated = Object.assign(new Lobby(data['host']), {
          ...data,
          createdAt: data['createdAt']?.toDate?.() ?? new Date()
        });

        callback(hydrated);
      }
    });
  }
  //#endregion

  //#region HeartBeat
  startHeartbeat(lobbyCode: string): void {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

    this.heartbeatInterval = setInterval(() => this.heartbeat(lobbyRef, playerRef, lobbyCode), 10000);
  }

  stopHeartbeat(): void {
    clearInterval(this.heartbeatInterval);
  }

  private async heartbeat(lobbyRef: DocumentReference, playerRef: DocumentReference, lobbyCode: string): Promise<void> {
    try {
      // 🫀 Player Heart beat
      await updateDoc(playerRef, { lastTimeSeen: serverTimestamp() });

      // 📊 Read Lobby and players
      const [lobbySnap, playersSnap] = await Promise.all([
        getDoc(lobbyRef),
        getDocs(collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION))
      ]);

      if (!lobbySnap.exists()) return;
      const lobbyData = lobbySnap.data();
      const now = Date.now();

      for (const docSnap of playersSnap.docs) {
        const data = docSnap.data();
        const lastSeen = data['lastTimeSeen']?.toDate?.();
        const targetId = docSnap.id;

        // ⏰ Kick if one minute inactive
        if (!lastSeen || now - lastSeen.getTime() > 60000) {
          await deleteDoc(docSnap.ref);

          // 👑 If host kick, I take ownership
          if (targetId === lobbyData['host']) {
            await updateDoc(lobbyRef, { host: this.playerId });
          }
        }
      }
    } catch (err) {
      console.error('Erreur heartbeat step :', err);
    }
  }

  //#endregion



  //#region Common
  async cleanLobbyDB(): Promise<void> {
    const lobbiesSnap = await getDocs(collection(this.db, this.LOBBY_COLLECTION));
    const now = Date.now();

    for (const docSnap of lobbiesSnap.docs) {
      const data = docSnap.data();
      const created = data['createdAt']?.toDate?.();
      if (!created) continue;

      const ageMs = now - created.getTime();
      if (ageMs > 24 * 60 * 60 * 1000) { // 1 day
        await deleteDoc(docSnap.ref);
      }
    }
  }
  //#endregion
}
