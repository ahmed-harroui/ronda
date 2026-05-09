// Types partagés pour le système multijoueur

export type PlayerStatus = 'connecting' | 'connected' | 'ready' | 'playing' | 'disconnected'

export interface Player {
  id: string
  name: string
  avatar: string
  status: PlayerStatus
  isHost: boolean
  position: number // 0-3 pour la position autour de la table
}

export interface RoomSettings {
  maxPlayers: 2 | 4
  targetScore: number
  allowSpectators: boolean
  isPrivate: boolean
}

export interface RoomState {
  roomId: string
  hostId: string
  players: Player[]
  settings: RoomSettings
  phase: 'lobby' | 'starting' | 'playing' | 'finished'
  gameState: MultiplayerGameState | null
  createdAt: number
}

// État du jeu synchronisé
export interface MultiplayerGameState {
  deck: string[] // IDs des cartes (chiffrées côté serveur)
  table: string[]
  hands: Record<string, string[]> // playerId -> cartes (chaque joueur ne voit que sa main)
  scores: Record<string, number>
  roundScores: Record<string, number>
  currentPlayer: string
  lastCapture: string | null
  capturedCards: Record<string, string[]>
  announcements: Announcement[]
  round: number
  phase: 'dealing' | 'playing' | 'scoring' | 'finished'
}

export interface Announcement {
  playerId: string
  type: 'ronda' | 'tringa' | 'missa'
  timestamp: number
}

// Messages Client -> Serveur
export type ClientMessage =
  | { type: 'join'; payload: { name: string; avatar: string } }
  | { type: 'leave' }
  | { type: 'ready' }
  | { type: 'not-ready' }
  | { type: 'start-game' }
  | { type: 'play-card'; payload: { cardId: string; targetCardIds?: string[] } }
  | { type: 'announce'; payload: { type: 'ronda' | 'tringa' | 'missa' } }
  | { type: 'update-settings'; payload: Partial<RoomSettings> }
  | { type: 'kick-player'; payload: { playerId: string } }
  | { type: 'chat'; payload: { message: string } }
  | { type: 'ping' }

// Messages Serveur -> Client
export type ServerMessage =
  | { type: 'room-state'; payload: RoomState }
  | { type: 'player-joined'; payload: Player }
  | { type: 'player-left'; payload: { playerId: string } }
  | { type: 'player-ready'; payload: { playerId: string; ready: boolean } }
  | { type: 'game-started'; payload: MultiplayerGameState }
  | { type: 'game-update'; payload: Partial<MultiplayerGameState> }
  | { type: 'your-hand'; payload: { cards: string[] } }
  | { type: 'card-played'; payload: { playerId: string; cardId: string; captured: string[] } }
  | { type: 'announcement'; payload: Announcement }
  | { type: 'round-end'; payload: { scores: Record<string, number>; roundScores: Record<string, number> } }
  | { type: 'game-end'; payload: { winner: string; finalScores: Record<string, number> } }
  | { type: 'error'; payload: { code: string; message: string } }
  | { type: 'chat'; payload: { playerId: string; playerName: string; message: string; timestamp: number } }
  | { type: 'pong' }

// Utilitaires
export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sans I, O, 0, 1 pour éviter confusion
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 2,
  targetScore: 21,
  allowSpectators: false,
  isPrivate: true,
}

export const AVATARS = [
  '🎴', '🃏', '♠️', '♥️', '♦️', '♣️', '👤', '👥',
  '🦁', '🦊', '🐺', '🦅', '🐎', '🐘', '🦋', '🌟'
]
