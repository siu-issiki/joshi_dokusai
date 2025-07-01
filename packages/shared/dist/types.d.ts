export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    handCount: number;
    isConnected: boolean;
    life: number;
    role: 'boss' | 'subordinate';
}
export interface Card {
    id: string;
    type: 'work' | 'dictatorship';
    category: 'attack' | 'defense' | 'recovery' | 'president' | 'dictatorship';
    name: string;
    description: string;
    isVisible: boolean;
}
export interface WorkCard extends Card {
    type: 'work';
    category: 'attack' | 'defense' | 'recovery' | 'president';
}
export interface DictatorshipCard extends Card {
    type: 'dictatorship';
    category: 'dictatorship';
    target: 'boss' | 'subordinate' | 'all';
}
export interface GameState {
    id: string;
    players: Player[];
    currentPlayerIndex: number;
    phase: 'waiting' | 'playing' | 'ended';
    turnCount: number;
    lastAction?: GameAction;
    discardPile: Card[];
    deckCount: number;
    presidentCard?: {
        card: Card;
        owner: 'boss' | 'subordinate';
        turnsRemaining: number;
    };
    dictatorshipEffectNullifications: {
        boss4Players: number;
        boss3Players: number;
    };
}
export interface GameAction {
    type: 'play-card' | 'draw-card' | 'pass-turn' | 'resign' | 'nullify-dictatorship';
    playerId: string;
    timestamp: number;
    cardId?: string;
    targetPlayerId?: string;
    diceResult?: number;
}
export interface Room {
    id: string;
    name: string;
    playerCount: number;
    maxPlayers: number;
    isGameStarted: boolean;
    isPrivate: boolean;
    createdBy: string;
    createdAt: number;
}
export interface ServerToClientEvents {
    'room-created': (data: {
        room: Room;
        playerId: string;
    }) => void;
    'room-joined': (data: {
        room: Room;
        players: Player[];
        playerId: string;
    }) => void;
    'room-left': () => void;
    'rooms-list': (data: {
        rooms: Room[];
    }) => void;
    'player-joined': (data: {
        player: Player;
        room: Room;
    }) => void;
    'player-left': (data: {
        playerId: string;
        room: Room;
    }) => void;
    'game-started': (data: {
        gameState: GameState;
        myHand: Card[];
    }) => void;
    'game-state-updated': (data: {
        gameState: GameState;
        myHand?: Card[];
        lastAction: GameAction;
    }) => void;
    'game-ended': (data: {
        winner: 'boss' | 'subordinate';
        finalScores: {
            playerId: string;
            score: number;
        }[];
        gameState: GameState;
    }) => void;
    'player-ready-updated': (data: {
        playerId: string;
        isReady: boolean;
        allPlayersReady: boolean;
    }) => void;
    'action-result': (data: {
        success: boolean;
        action: GameAction;
        message?: string;
        newCards?: Card[];
    }) => void;
    'turn-changed': (data: {
        currentPlayerId: string;
        previousPlayerId: string;
        turnCount: number;
    }) => void;
    error: (data: {
        code: string;
        message: string;
        details?: any;
    }) => void;
    notification: (data: {
        type: 'info' | 'warning' | 'success';
        message: string;
        duration?: number;
    }) => void;
    'player-disconnected': (data: {
        playerId: string;
        playerName: string;
    }) => void;
    'player-reconnected': (data: {
        playerId: string;
        playerName: string;
    }) => void;
}
export interface ClientToServerEvents {
    'create-room': (data: {
        roomName: string;
        maxPlayers: number;
        isPrivate: boolean;
        password?: string;
    }) => void;
    'join-room': (data: {
        roomId: string;
        playerName: string;
        password?: string;
    }) => void;
    'leave-room': () => void;
    'get-rooms': () => void;
    'player-ready': (data: {
        isReady: boolean;
    }) => void;
    'start-game': () => void;
    'play-card': (data: {
        cardId: string;
        targetPlayerId?: string;
    }) => void;
    'draw-card': () => void;
    'pass-turn': () => void;
    resign: () => void;
    'nullify-dictatorship': () => void;
}
export declare const ERROR_CODES: {
    readonly ROOM_NOT_FOUND: "ROOM_NOT_FOUND";
    readonly ROOM_FULL: "ROOM_FULL";
    readonly INVALID_PASSWORD: "INVALID_PASSWORD";
    readonly ALREADY_IN_ROOM: "ALREADY_IN_ROOM";
    readonly GAME_NOT_STARTED: "GAME_NOT_STARTED";
    readonly NOT_YOUR_TURN: "NOT_YOUR_TURN";
    readonly INVALID_CARD: "INVALID_CARD";
    readonly CARD_NOT_IN_HAND: "CARD_NOT_IN_HAND";
    readonly INVALID_ACTION: "INVALID_ACTION";
    readonly CONNECTION_ERROR: "CONNECTION_ERROR";
    readonly AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
};
//# sourceMappingURL=types.d.ts.map