import { DocumentReference, Firestore, Query, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, increment, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from '@firebase/firestore';
import { GameState, Lobby } from '../../shared/DTO/lobby';
import { Observable, ReplaySubject, Subject } from 'rxjs';

import { AppComponent } from '../../app.component';
import { Injectable } from '@angular/core';
import { Player } from '../../shared/DTO/player';
import { SystemMessageProvider } from 'src/app/shared/system-message-provider';
import { UserConfigService } from 'src/app/services/userconfig.service';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  readonly LOBBY_COLLECTION = "lobby"
  readonly PLAYERS_COLLECTION = "players"

  db: Firestore
  playerId: string
  playerName: string
  heartbeatInterval: any;

  constructor(userConfigService: UserConfigService) {
    this.db = getFirestore()
    this.playerId = userConfigService.getConfig()["playerId"]
    this.playerName = userConfigService.getConfig()["gameName"]
  }

  //#region Queries
  playersQuery(lobbyCode: string): Query {
    return query(
      collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION),
      where('isConnected', '==', true)
    );
  }
  //#endregion


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

      const player = new Player(this.playerId, this.playerName);
      const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);

      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        console.warn("Player already in lobby. Continuing ...");
        const existingPlayer = playerSnap.data();

        if (existingPlayer['wasKicked'])
          await this.sendSystemMessage(lobbyCode, "is trying to join again after having been kicked." + SystemMessageProvider.get('rejoinAfterKicked'));
        else
          await this.sendSystemMessage(lobbyCode, SystemMessageProvider.get('rejoin'));

        await updateDoc(playerRef, { isConnected: true, lastTimeSeen: serverTimestamp() });
      } else {
        await setDoc(playerRef, { ...player });
      }

      this.startHeartbeat(lobbyCode);

      // 👑 Claim ownership if lobby has no owner
      const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
      const lobbySnap = await getDoc(lobbyRef);
      const lobbyData = lobbySnap.data();
      if (lobbyData && !lobbyData['host']) {
        console.log("Claiming lobby ownership", lobbyCode)
        await this.sendSystemMessage(lobbyCode, SystemMessageProvider.get('hostChange'));
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
    this.playerName = newName
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
      throw new Error('Only the host can kick players');
    }

    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, targetPlayerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      throw new Error('Player does not exist');
    }

    await updateDoc(playerRef, {
      isConnected: false,
      wasKicked: true,
      lastTimeSeen: serverTimestamp()
    });

    await this.sendSystemMessage(lobbyCode, SystemMessageProvider.get("kick"));
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
    console.log("Leaving Lobby ", lobbyCode);
    this.stopHeartbeat();

    const playerRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION, this.playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      throw new Error('Player not present in lobby');
    }

    await updateDoc(playerRef, {
      isConnected: false,
      lastTimeSeen: serverTimestamp()
    });


    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) throw new Error('Lobby does not exist');

    if (lobbySnap.data()['host'] === this.playerId) {
      const playersSnap = await getDocs(this.playersQuery(lobbyCode));

      if (!playersSnap.empty) {
        const newHostId = playersSnap.docs[0].id;
        await updateDoc(lobbyRef, { host: newHostId });
      } else {
        console.log("No connected players available to transfer host.");
      }
    }
    await this.sendSystemMessage(lobbyCode, SystemMessageProvider.get('disconnect'));
  }

  async sendSystemMessage(lobbyCode: string, message: string, durationMs: number = 5000): Promise<void> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);

    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) throw new Error("Lobby not found");

    message = this.playerName + " : " + message

    // Send system message
    await updateDoc(lobbyRef, {
      systemMessage: message,
      systemMessageTimestamp: serverTimestamp()
    });

    // Auto-clear after duration
    setTimeout(async () => {
      // Optional: check if message is still the same before clearing
      const currentSnap = await getDoc(lobbyRef);
      if (currentSnap.exists() && currentSnap.data()['systemMessage'] === message) {
        await updateDoc(lobbyRef, { systemMessage: null });
      }
    }, durationMs);
  }



  /**
   * LISTENERS
   */
  listenPlayers(lobbyCode: string, callback: (players: Player[]) => void): () => void {
    const playersRef = collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION);
    const connectedPlayersQuery = query(playersRef, where('isConnected', '==', true));

    return onSnapshot(connectedPlayersQuery, (snapshot) => {
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
        getDocs(this.playersQuery(lobbyCode))
      ]);

      if (!lobbySnap.exists()) return;
      const lobbyData = lobbySnap.data();
      const now = Date.now();

      for (const docSnap of playersSnap.docs) {
        const data = docSnap.data();

        const lastSeen = data['lastTimeSeen']?.toDate?.();
        const targetId = docSnap.id;

        // ⏰ Kick if one minute inactive
        if (targetId != this.playerId && lastSeen && (now - lastSeen.getTime() > 60000)) {
          console.log("Inactive player found. Kicking ...", docSnap)

          await updateDoc(docSnap.ref, {
            isConnected: false,
            lastTimeSeen: serverTimestamp()
          });

          // 👑 If host kick, I take ownership
          if (targetId === lobbyData['host']) {
            console.log("Kicked player was owner. Trying to steal ownership !")
            await this.sendSystemMessage(lobbyCode, SystemMessageProvider.get('hostChange'));
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
    const playersCollectionRef = collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION);
    const querySnapshot = await getDocs(playersCollectionRef);

    const readyCount = querySnapshot.docs.filter(doc => doc.data()['isReady']).length;

    // Score calculation
    const scoreMap = [10, 8, 6, 4, 2];
    const score = scoreMap[readyCount] ?? 1;

    const playerRef = doc(playersCollectionRef, this.playerId);
    const snap = await getDoc(playerRef);

    if (!snap.exists()) {
      throw new Error('Player does not exist');
    }

    await updateDoc(playerRef, {
      isReady: true,
      score: increment(score),
      answerOrder: readyCount + 1
    });
  }


  async advanceToNextQuestion(lobbyCode: string): Promise<void> {
    const lobbyRef = doc(this.db, this.LOBBY_COLLECTION, lobbyCode);
    const snap = await getDoc(lobbyRef);

    if (!snap.exists()) {
      throw new Error('Lobby not found');
    }

    // 🔁 Fetch all players and reset their readiness
    const playersCollectionRef = collection(this.db, this.LOBBY_COLLECTION, lobbyCode, this.PLAYERS_COLLECTION);
    const playerSnaps = await getDocs(playersCollectionRef);

    const batch = writeBatch(this.db);
    playerSnaps.forEach(playerDoc => {
      batch.update(playerDoc.ref, { isReady: false, answerOrder: 0 });
    });
    await batch.commit();

    // ⬇️ Update lobby state and question count
    const lobbyData = snap.data() as Lobby;
    const newQuestionCount = lobbyData.questionCount - 1;
    const newState = newQuestionCount > 0 ? GameState.GameQuestion : GameState.InVictoryRoom;

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
