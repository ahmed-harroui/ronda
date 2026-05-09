import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection) {
    console.log("Connected:", conn.id);

    this.party.broadcast(
      JSON.stringify({
        type: "PLAYER_JOINED",
        playerId: conn.id,
      })
    );
  }

  onMessage(message: string) {
    this.party.broadcast(message);
  }

  onClose(conn: Party.Connection) {
    console.log("Disconnected:", conn.id);

    this.party.broadcast(
      JSON.stringify({
        type: "PLAYER_LEFT",
        playerId: conn.id,
      })
    );
  }
}