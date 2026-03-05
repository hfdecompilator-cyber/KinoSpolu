import type { ClientRole, ClientToServer, ServerToClient } from "./wsProtocol";

type RoomState = Extract<ServerToClient, { type: "room_state" }>;
type RoomCreated = Extract<ServerToClient, { type: "room_created" }>;

export type WsEvents = {
  onOpen?: () => void;
  onClose?: () => void;
  onRoomCreated?: (evt: RoomCreated) => void;
  onRoomState?: (evt: RoomState) => void;
  onError?: (message: string) => void;
};

export class RoomWsClient {
  private ws: WebSocket | null = null;

  constructor(
    private url: string,
    private events: WsEvents,
  ) {}

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener("open", () => this.events.onOpen?.());
    this.ws.addEventListener("close", () => this.events.onClose?.());
    this.ws.addEventListener("message", (msg) => {
      try {
        const parsed = JSON.parse(String(msg.data)) as ServerToClient;
        if (parsed.type === "room_created") this.events.onRoomCreated?.(parsed);
        else if (parsed.type === "room_state") this.events.onRoomState?.(parsed);
        else if (parsed.type === "error") this.events.onError?.(parsed.message);
      } catch {
        this.events.onError?.("Bad message from server");
      }
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  createRoom(displayName: string, clientId: string) {
    this.send({ type: "create_room", displayName, clientId });
  }

  joinRoom(args: { roomCode: string; displayName: string; clientId: string; role: ClientRole; hostKey?: string }) {
    this.send({ type: "join_room", ...args });
  }

  playback(args: { roomCode: string; clientId: string; action: "play" | "pause" | "seek"; timeSeconds?: number }) {
    this.send({ type: "playback", ...args });
  }

  private send(payload: ClientToServer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.events.onError?.("Not connected to sync server");
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }
}

