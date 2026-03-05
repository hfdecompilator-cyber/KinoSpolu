export type ClientRole = "web" | "netflix";

export type ClientToServer =
  | {
      type: "create_room";
      displayName: string;
      clientId: string;
    }
  | {
      type: "join_room";
      roomCode: string;
      displayName: string;
      clientId: string;
      role: ClientRole;
      hostKey?: string;
    }
  | {
      type: "playback";
      roomCode: string;
      clientId: string;
      action: "play" | "pause" | "seek";
      timeSeconds?: number;
    };

export type ServerToClient =
  | {
      type: "room_created";
      roomCode: string;
      hostKey: string;
      hostClientId: string;
    }
  | {
      type: "room_state";
      roomCode: string;
      hostClientId: string;
      participants: Array<{
        clientId: string;
        displayName: string;
        role: ClientRole;
        canControl: boolean;
      }>;
      playback: {
        isPlaying: boolean;
        timeSeconds: number;
        updatedAtMs: number;
        lastActionBy?: string;
        lastActionClientId?: string;
      };
    }
  | {
      type: "error";
      message: string;
    };

