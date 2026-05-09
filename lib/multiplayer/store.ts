'use client'

import { create } from 'zustand'
import type {
  RoomState,
  Player,
  MultiplayerGameState,
  ServerMessage,
  ClientMessage,
  RoomSettings,
  Announcement,
} from './types'

interface ChatMessage {
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

interface MultiplayerStore {
  // Connection state
  socket: WebSocket | null
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  error: string | null
  
  // Room state
  roomId: string | null
  roomState: RoomState | null
  
  // Local player
  playerId: string | null
  playerName: string
  playerAvatar: string
  
  // Game state
  myHand: string[]
  gameState: MultiplayerGameState | null
  
  // UI state
  chatMessages: ChatMessage[]
  lastAnnouncement: Announcement | null
  
  // Actions
  connect: (roomId: string, host: string) => void
  disconnect: () => void
  setPlayerInfo: (name: string, avatar: string) => void
  
  // Room actions
  joinRoom: () => void
  leaveRoom: () => void
  setReady: (ready: boolean) => void
  startGame: () => void
  updateSettings: (settings: Partial<RoomSettings>) => void
  kickPlayer: (playerId: string) => void
  
  // Game actions
  playCard: (cardId: string, targetCardIds?: string[]) => void
  announce: (type: 'ronda' | 'tringa' | 'missa') => void
  
  // Chat
  sendChat: (message: string) => void
  
  // Internal
  _handleMessage: (msg: ServerMessage) => void
  _send: (msg: ClientMessage) => void
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  // Initial state
  socket: null,
  connectionStatus: 'disconnected',
  error: null,
  roomId: null,
  roomState: null,
  playerId: null,
  playerName: '',
  playerAvatar: '',
  myHand: [],
  gameState: null,
  chatMessages: [],
  lastAnnouncement: null,

  connect: (roomId: string, host: string) => {
    const { socket: existingSocket, playerName, playerAvatar } = get()
    
    // Close existing connection
    if (existingSocket) {
      existingSocket.close()
    }
    
    set({ connectionStatus: 'connecting', error: null, roomId })
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${host}/party/${roomId}`
    
    const socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      set({ connectionStatus: 'connected', socket, playerId: socket.url })
      
      // Auto-join if we have player info
      if (playerName) {
        get()._send({ type: 'join', payload: { name: playerName, avatar: playerAvatar } })
      }
    }
    
    socket.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)
        get()._handleMessage(msg)
      } catch (err) {
        console.error('[v0] Failed to parse message:', err)
      }
    }
    
    socket.onclose = () => {
      set({ connectionStatus: 'disconnected', socket: null })
    }
    
    socket.onerror = () => {
      set({ connectionStatus: 'error', error: 'Erreur de connexion' })
    }
    
    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      get()._send({ type: 'leave' })
      socket.close()
    }
    set({
      socket: null,
      connectionStatus: 'disconnected',
      roomId: null,
      roomState: null,
      myHand: [],
      gameState: null,
      chatMessages: [],
    })
  },

  setPlayerInfo: (name: string, avatar: string) => {
    set({ playerName: name, playerAvatar: avatar })
  },

  joinRoom: () => {
    const { playerName, playerAvatar } = get()
    get()._send({ type: 'join', payload: { name: playerName, avatar: playerAvatar } })
  },

  leaveRoom: () => {
    get()._send({ type: 'leave' })
    get().disconnect()
  },

  setReady: (ready: boolean) => {
    get()._send({ type: ready ? 'ready' : 'not-ready' })
  },

  startGame: () => {
    get()._send({ type: 'start-game' })
  },

  updateSettings: (settings: Partial<RoomSettings>) => {
    get()._send({ type: 'update-settings', payload: settings })
  },

  kickPlayer: (playerId: string) => {
    get()._send({ type: 'kick-player', payload: { playerId } })
  },

  playCard: (cardId: string, targetCardIds?: string[]) => {
    get()._send({ type: 'play-card', payload: { cardId, targetCardIds } })
  },

  announce: (type: 'ronda' | 'tringa' | 'missa') => {
    get()._send({ type: 'announce', payload: { type } })
  },

  sendChat: (message: string) => {
    get()._send({ type: 'chat', payload: { message } })
  },

  _handleMessage: (msg: ServerMessage) => {
    switch (msg.type) {
      case 'room-state':
        set({ 
          roomState: msg.payload,
          gameState: msg.payload.gameState,
        })
        break
        
      case 'player-joined':
        set(state => ({
          roomState: state.roomState ? {
            ...state.roomState,
            players: [...state.roomState.players, msg.payload],
          } : null,
        }))
        break
        
      case 'player-left':
        set(state => ({
          roomState: state.roomState ? {
            ...state.roomState,
            players: state.roomState.players.filter(p => p.id !== msg.payload.playerId),
          } : null,
        }))
        break
        
      case 'player-ready':
        set(state => ({
          roomState: state.roomState ? {
            ...state.roomState,
            players: state.roomState.players.map(p => 
              p.id === msg.payload.playerId 
                ? { ...p, status: msg.payload.ready ? 'ready' : 'connected' }
                : p
            ),
          } : null,
        }))
        break
        
      case 'game-started':
        set({ gameState: msg.payload })
        break
        
      case 'game-update':
        set(state => ({
          gameState: state.gameState ? { ...state.gameState, ...msg.payload } : null,
        }))
        break
        
      case 'your-hand':
        set({ myHand: msg.payload.cards })
        break
        
      case 'card-played':
        set(state => {
          if (!state.gameState) return state
          
          // Update table
          let newTable = [...state.gameState.table]
          if (msg.payload.captured.length > 0) {
            newTable = newTable.filter(c => !msg.payload.captured.includes(c))
          } else {
            newTable.push(msg.payload.cardId)
          }
          
          return {
            gameState: {
              ...state.gameState,
              table: newTable,
            },
          }
        })
        break
        
      case 'announcement':
        set({ lastAnnouncement: msg.payload })
        // Clear after 3 seconds
        setTimeout(() => {
          set(state => 
            state.lastAnnouncement?.timestamp === msg.payload.timestamp 
              ? { lastAnnouncement: null } 
              : state
          )
        }, 3000)
        break
        
      case 'round-end':
        set(state => ({
          gameState: state.gameState ? {
            ...state.gameState,
            scores: msg.payload.scores,
            roundScores: msg.payload.roundScores,
          } : null,
        }))
        break
        
      case 'game-end':
        set(state => ({
          gameState: state.gameState ? {
            ...state.gameState,
            phase: 'finished',
            scores: msg.payload.finalScores,
          } : null,
          roomState: state.roomState ? {
            ...state.roomState,
            phase: 'finished',
          } : null,
        }))
        break
        
      case 'chat':
        set(state => ({
          chatMessages: [...state.chatMessages.slice(-49), msg.payload],
        }))
        break
        
      case 'error':
        set({ error: msg.payload.message })
        // Clear error after 5 seconds
        setTimeout(() => set({ error: null }), 5000)
        break
    }
  },

  _send: (msg: ClientMessage) => {
    const { socket, connectionStatus } = get()
    if (socket && connectionStatus === 'connected') {
      socket.send(JSON.stringify(msg))
    }
  },
}))

// Selectors
export const useIsHost = () => useMultiplayerStore(state => {
  const me = state.roomState?.players.find(p => p.id === state.playerId)
  return me?.isHost ?? false
})

export const useMyPlayer = () => useMultiplayerStore(state => 
  state.roomState?.players.find(p => p.id === state.playerId)
)

export const useOtherPlayers = () => useMultiplayerStore(state =>
  state.roomState?.players.filter(p => p.id !== state.playerId) ?? []
)

export const useIsMyTurn = () => useMultiplayerStore(state =>
  state.gameState?.currentPlayer === state.playerId
)

export const useCanStartGame = () => useMultiplayerStore(state => {
  if (!state.roomState) return false
  const readyPlayers = state.roomState.players.filter(p => p.status === 'ready' || p.isHost)
  return readyPlayers.length >= 2
})
