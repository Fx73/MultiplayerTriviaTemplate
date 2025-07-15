import { DocumentReference, Firestore, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, increment, onSnapshot, serverTimestamp, setDoc, updateDoc } from '@firebase/firestore';
import { GameState, Lobby } from '../../shared/DTO/lobby';
import { Observable, ReplaySubject, Subject } from 'rxjs';

import { AppComponent } from '../../app.component';
import { Injectable } from '@angular/core';
import { Player } from '../../shared/DTO/player';
import { UserConfigService } from 'src/app/services/userconfig.service';
import { UserFirestoreService } from './user.firestore.service';
import { WelcomePage } from '../../pages/welcome/welcome.page';

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
    this.playerId = this.userConfigService.getConfig()["playerId"]

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
  async createLobby(lobbyCode: string): Promise<boolean> {
    console.log("Creating lobby", lobbyCode)
    try {
      if (await this.lobbyAlreadyExist(lobbyCode)) {
        AppComponent.presentWarningToast("Lobby already exists");
        return false;
      }

      const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
      const emptyLobby = new Lobby()

      await setDoc(lobbyRef, { ...emptyLobby });
      return true;
    } catch (err) {
      console.error("Error creating lobby:", err);
      return false;
    }
  }


  async joinLobby(lobbyCode: string): Promise<boolean> {
    console.log("Joining lobby", lobbyCode)
    try {
      if (await this.lobbyDoesNotExist(lobbyCode)) {
        console.warn("Lobby does not exist");
        return false;
      }

      const playerName: string = this.userConfigService.getConfig()["gameName"];
      const player = new Player(this.playerId, playerName);
      const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        console.warn("Player already in lobby");
        this.startHeartbeat(lobbyCode);
        return true;
      }

      await setDoc(playerRef, { ...player });
      this.startHeartbeat(lobbyCode);

      // 👑 Claim ownership if lobby has no owner
      const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
      const lobbySnap = await getDoc(lobbyRef);
      const lobbyData = lobbySnap.data();
      if (lobbyData && !lobbyData['host']) {
        console.log("Claiming lobby ownership", lobbyCode)
        await updateDoc(lobbyRef, { host: this.playerId });
      }

      return true;
    } catch (err) {
      console.error("Error joining lobby:", err);
      return false;
    }
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
    console.log("Kicking Player : ", targetPlayerId)
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
    console.log("Updating Lobby ", lobbyCode, key, value)
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const snap = await getDoc(lobbyRef);

    if (!snap.exists()) {
      throw new Error('Lobby does not exist');
    }

    await updateDoc(lobbyRef, { [key]: value });
  }

  async leaveLobby(lobbyCode: string): Promise<void> {
    console.log("Leaving Lobby ", lobbyCode)
    this.stopHeartbeat()

    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

    const snap = await getDoc(playerRef);
    if (!snap.exists()) {
      throw new Error('Player not present in lobby');
    }
    await deleteDoc(playerRef);

    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Lobby does not exist')

    if (lobbySnap.data()['host'] === this.playerId) {
      const playersSnap = await getDocs(collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION));
      if (!playersSnap.empty) {
        const newHostId = playersSnap.docs[0].id;
        await updateDoc(lobbyRef, { host: newHostId });
      }
    }
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
        const hydrated = Object.assign(new Lobby(), {
          ...data,
          createdAt: data['createdAt']?.toDate?.() ?? new Date(),
          state: data['state'] as GameState
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
      console.log("🫀 HEARTBEAT")
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
        if (targetId != this.playerId && (now - lastSeen.getTime() > 60000)) {
          console.log("Inactive player found. Kicking ...", docSnap)

          await deleteDoc(docSnap.ref);

          // 👑 If host kick, I take ownership
          if (targetId === lobbyData['host']) {
            console.log("Kicked player was owner. Trying to steal ownership !")
            await updateDoc(lobbyRef, { host: this.playerId });
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'not-found')
        AppComponent.presentErrorToast("YOU HAVE BEEN KICKED FROM LOBBY")
      else
        console.error('Erreur heartbeat step :', err);
    }
  }

  //#endregion

  //#region Game
  async playerFoundAnswer(lobbyCode: string): Promise<void> {
    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);
    const snap = await getDoc(playerRef);

    if (!snap.exists()) {
      throw new Error('Player does not exist');
    }

    await updateDoc(playerRef, {
      isReady: true,
      score: increment(1)
    });
  }

  async advanceToNextQuestion(lobbyCode: string): Promise<void> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const snap = await getDoc(lobbyRef);

    if (!snap.exists()) {
      throw new Error('Lobby not found');
    }

    const lobbyData = snap.data() as Lobby;
    const newQuestionCount = lobbyData.questionCount - 1
    const newState = lobbyData.questionCount > 0 ? GameState.GameQuestion : GameState.InVictoryRoom

    await updateDoc(lobbyRef, {
      questionCount: newQuestionCount,
      state: newState
    });
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
