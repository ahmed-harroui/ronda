'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMultiplayerStore } from './store'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'moroccan-cards.partykit.dev'

export function usePartyConnection(roomId: string | null) {
  const connect = useMultiplayerStore(state => state.connect)
  const disconnect = useMultiplayerStore(state => state.disconnect)
  const connectionStatus = useMultiplayerStore(state => state.connectionStatus)
  const error = useMultiplayerStore(state => state.error)
  
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  
  const attemptConnect = useCallback(() => {
    if (roomId) {
      connect(roomId, PARTYKIT_HOST)
    }
  }, [roomId, connect])
  
  useEffect(() => {
    if (!roomId) return
    
    attemptConnect()
    
    return () => {
      disconnect()
    }
  }, [roomId, attemptConnect, disconnect])
  
  // Auto-reconnect logic
  useEffect(() => {
    if (connectionStatus === 'disconnected' && roomId && reconnectAttempts.current < maxReconnectAttempts) {
      const timeout = setTimeout(() => {
        reconnectAttempts.current++
        attemptConnect()
      }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000))
      
      return () => clearTimeout(timeout)
    }
    
    if (connectionStatus === 'connected') {
      reconnectAttempts.current = 0
    }
  }, [connectionStatus, roomId, attemptConnect])
  
  return {
    connectionStatus,
    error,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
  }
}

export function useRoomActions() {
  const joinRoom = useMultiplayerStore(state => state.joinRoom)
  const leaveRoom = useMultiplayerStore(state => state.leaveRoom)
  const setReady = useMultiplayerStore(state => state.setReady)
  const startGame = useMultiplayerStore(state => state.startGame)
  const updateSettings = useMultiplayerStore(state => state.updateSettings)
  const kickPlayer = useMultiplayerStore(state => state.kickPlayer)
  
  return {
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    updateSettings,
    kickPlayer,
  }
}

export function useGameActions() {
  const playCard = useMultiplayerStore(state => state.playCard)
  const announce = useMultiplayerStore(state => state.announce)
  
  return {
    playCard,
    announce,
  }
}

export function useChatActions() {
  const sendChat = useMultiplayerStore(state => state.sendChat)
  const chatMessages = useMultiplayerStore(state => state.chatMessages)
  
  return {
    sendChat,
    chatMessages,
  }
}

export function useRoomState() {
  const roomState = useMultiplayerStore(state => state.roomState)
  const roomId = useMultiplayerStore(state => state.roomId)
  
  return {
    roomState,
    roomId,
    phase: roomState?.phase ?? 'lobby',
    players: roomState?.players ?? [],
    settings: roomState?.settings,
    hostId: roomState?.hostId,
  }
}

export function useGameState() {
  const gameState = useMultiplayerStore(state => state.gameState)
  const myHand = useMultiplayerStore(state => state.myHand)
  const lastAnnouncement = useMultiplayerStore(state => state.lastAnnouncement)
  
  return {
    gameState,
    myHand,
    table: gameState?.table ?? [],
    currentPlayer: gameState?.currentPlayer,
    scores: gameState?.scores ?? {},
    roundScores: gameState?.roundScores ?? {},
    phase: gameState?.phase ?? 'dealing',
    round: gameState?.round ?? 1,
    lastAnnouncement,
  }
}

export function usePlayerInfo() {
  const setPlayerInfo = useMultiplayerStore(state => state.setPlayerInfo)
  const playerName = useMultiplayerStore(state => state.playerName)
  const playerAvatar = useMultiplayerStore(state => state.playerAvatar)
  const playerId = useMultiplayerStore(state => state.playerId)
  
  return {
    setPlayerInfo,
    playerName,
    playerAvatar,
    playerId,
  }
}
