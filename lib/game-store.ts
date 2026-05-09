import { create } from 'zustand'
import {
  type Card,
  type Player,
  type GameState,
  type Announcement,
  createDeck,
  shuffleDeck,
  dealCards,
  dealToTable,
  findCapturableCards,
  checkRonda,
  checkTringa,
  getAIMove,
  calculateScore,
  SCORING,
} from './card-engine'

interface GameStore extends GameState {
  // Actions
  initGame: (playerNames: string[], aiCount: number) => void
  startRound: () => void
  playCard: (card: Card, captures: Card[]) => void
  announceRonda: (playerId: string) => void
  announceTringa: (playerId: string) => void
  nextTurn: () => void
  endRound: () => void
  resetGame: () => void
  
  // AI
  playAITurn: () => void
  
  // Helpers
  getCurrentPlayer: () => Player | null
  canPlayCard: (card: Card) => Card[]
  isGameOver: () => boolean
}

export const useGameStore = create<GameStore>((set, get) => ({
  deck: [],
  table: [],
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  phase: 'waiting',
  lastCapture: null,
  announcements: [],

  initGame: (playerNames: string[], aiCount: number) => {
    const players: Player[] = []
    
    for (const name of playerNames) {
      players.push({
        id: `player-${players.length}`,
        name,
        hand: [],
        captured: [],
        score: 0,
        isAI: false,
      })
    }
    
    for (let i = 0; i < aiCount; i++) {
      players.push({
        id: `ai-${i}`,
        name: `Bot ${i + 1}`,
        hand: [],
        captured: [],
        score: 0,
        isAI: true,
      })
    }
    
    set({
      players,
      deck: [],
      table: [],
      currentPlayerIndex: 0,
      round: 1,
      phase: 'waiting',
      lastCapture: null,
      announcements: [],
    })
  },

  startRound: () => {
    const state = get()
    let deck = shuffleDeck(createDeck())
    
    // Reset player hands and deal 3 cards each
    let players = state.players.map(p => ({ ...p, hand: [] }))
    const dealResult = dealCards(deck, players, 3)
    deck = dealResult.deck
    players = dealResult.players
    
    // Deal 4 cards to table
    const tableResult = dealToTable(deck, 4)
    deck = tableResult.deck
    
    set({
      deck,
      table: tableResult.tableCards,
      players,
      phase: 'playing',
      currentPlayerIndex: 0,
      lastCapture: null,
    })
  },

  playCard: (card: Card, captures: Card[]) => {
    const state = get()
    const currentPlayer = state.players[state.currentPlayerIndex]
    
    if (!currentPlayer || currentPlayer.isAI) return
    
    // Remove card from hand
    const newHand = currentPlayer.hand.filter(c => c.id !== card.id)
    
    // Handle captures
    let newTable = [...state.table]
    let newCaptured = [...currentPlayer.captured]
    const newAnnouncements = [...state.announcements]
    
    if (captures.length > 0) {
      // Remove captured cards from table
      newTable = newTable.filter(c => !captures.some(cap => cap.id === c.id))
      // Add captured cards + played card to player's pile
      newCaptured = [...newCaptured, ...captures, card]
      
      // Check for Missa (cleared table)
      if (newTable.length === 0) {
        newAnnouncements.push({
          type: 'missa',
          playerId: currentPlayer.id,
          cards: captures,
          points: SCORING.MISSA,
        })
      }
    } else {
      // No capture - card goes to table
      newTable.push(card)
    }
    
    // Update player
    const newPlayers = state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, hand: newHand, captured: newCaptured }
        : p
    )
    
    set({
      players: newPlayers,
      table: newTable,
      announcements: newAnnouncements,
      lastCapture: captures.length > 0 ? { playerId: currentPlayer.id, cards: captures } : state.lastCapture,
    })
    
    // Move to next turn
    get().nextTurn()
  },

  announceRonda: (playerId: string) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (!player) return
    
    const rondaCards = checkRonda(player.hand)
    if (rondaCards) {
      set({
        announcements: [
          ...state.announcements,
          {
            type: 'ronda',
            playerId,
            cards: rondaCards,
            points: SCORING.RONDA,
          },
        ],
      })
    }
  },

  announceTringa: (playerId: string) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (!player) return
    
    const tringaCards = checkTringa(player.hand)
    if (tringaCards) {
      set({
        announcements: [
          ...state.announcements,
          {
            type: 'tringa',
            playerId,
            cards: tringaCards,
            points: SCORING.TRINGA,
          },
        ],
      })
    }
  },

  nextTurn: () => {
    const state = get()
    
    // Check if all players have empty hands
    const allHandsEmpty = state.players.every(p => p.hand.length === 0)
    
    if (allHandsEmpty) {
      // Check if deck has more cards to deal
      if (state.deck.length >= state.players.length * 3) {
        // Deal more cards
        const dealResult = dealCards(state.deck, state.players, 3)
        set({
          deck: dealResult.deck,
          players: dealResult.players,
          currentPlayerIndex: 0,
        })
      } else {
        // End round
        get().endRound()
      }
      return
    }
    
    // Move to next player with cards
    let nextIndex = (state.currentPlayerIndex + 1) % state.players.length
    let attempts = 0
    while (state.players[nextIndex].hand.length === 0 && attempts < state.players.length) {
      nextIndex = (nextIndex + 1) % state.players.length
      attempts++
    }
    
    set({ currentPlayerIndex: nextIndex })
    
    // If next player is AI, play their turn after a delay
    const nextPlayer = state.players[nextIndex]
    if (nextPlayer?.isAI && nextPlayer.hand.length > 0) {
      setTimeout(() => {
        get().playAITurn()
      }, 1000)
    }
  },

  playAITurn: () => {
    const state = get()
    const currentPlayer = state.players[state.currentPlayerIndex]
    
    if (!currentPlayer || !currentPlayer.isAI || currentPlayer.hand.length === 0) return
    
    // Check for announcements
    const rondaCards = checkRonda(currentPlayer.hand)
    const tringaCards = checkTringa(currentPlayer.hand)
    
    if (tringaCards) {
      get().announceTringa(currentPlayer.id)
    } else if (rondaCards) {
      get().announceRonda(currentPlayer.id)
    }
    
    // Get AI move
    const { card, captures } = getAIMove(currentPlayer.hand, state.table)
    
    // Remove card from hand
    const newHand = currentPlayer.hand.filter(c => c.id !== card.id)
    
    // Handle captures
    let newTable = [...state.table]
    let newCaptured = [...currentPlayer.captured]
    const newAnnouncements = [...state.announcements]
    
    if (captures.length > 0) {
      newTable = newTable.filter(c => !captures.some(cap => cap.id === c.id))
      newCaptured = [...newCaptured, ...captures, card]
      
      if (newTable.length === 0) {
        newAnnouncements.push({
          type: 'missa',
          playerId: currentPlayer.id,
          cards: captures,
          points: SCORING.MISSA,
        })
      }
    } else {
      newTable.push(card)
    }
    
    const newPlayers = state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, hand: newHand, captured: newCaptured }
        : p
    )
    
    set({
      players: newPlayers,
      table: newTable,
      announcements: newAnnouncements,
      lastCapture: captures.length > 0 ? { playerId: currentPlayer.id, cards: captures } : state.lastCapture,
    })
    
    get().nextTurn()
  },

  endRound: () => {
    const state = get()
    
    // Give remaining table cards to last player who captured
    let newPlayers = [...state.players]
    if (state.lastCapture && state.table.length > 0) {
      newPlayers = newPlayers.map(p =>
        p.id === state.lastCapture?.playerId
          ? { ...p, captured: [...p.captured, ...state.table] }
          : p
      )
    }
    
    // Calculate scores
    const maxCards = Math.max(...newPlayers.map(p => p.captured.length))
    newPlayers = newPlayers.map(p => {
      let score = calculateScore(p, state.announcements)
      if (p.captured.length === maxCards) {
        score += SCORING.MOST_CARDS
      }
      return { ...p, score: p.score + score }
    })
    
    set({
      players: newPlayers,
      table: [],
      phase: 'scoring',
    })
  },

  resetGame: () => {
    set({
      deck: [],
      table: [],
      players: [],
      currentPlayerIndex: 0,
      round: 1,
      phase: 'waiting',
      lastCapture: null,
      announcements: [],
    })
  },

  getCurrentPlayer: () => {
    const state = get()
    return state.players[state.currentPlayerIndex] || null
  },

  canPlayCard: (card: Card) => {
    const state = get()
    return findCapturableCards(card, state.table)
  },

  isGameOver: () => {
    const state = get()
    return state.phase === 'ended'
  },
}))
