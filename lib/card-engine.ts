// Moroccan Card Engine - Core Types and Logic

export type Suit = 'dhab' | 'gobass' | 'sif' | 'gra3'

export interface Card {
  id: string
  suit: Suit
  value: number
  label: string
  image: string
}

export interface Player {
  id: string
  name: string
  hand: Card[]
  captured: Card[]
  score: number
  isAI: boolean
}

export interface GameState {
  deck: Card[]
  table: Card[]
  players: Player[]
  currentPlayerIndex: number
  round: number
  phase: 'waiting' | 'dealing' | 'playing' | 'scoring' | 'ended'
  lastCapture: { playerId: string; cards: Card[] } | null
  announcements: Announcement[]
}

export interface Announcement {
  type: 'ronda' | 'tringa' | 'missa'
  playerId: string
  cards: Card[]
  points: number
}

// Suit labels in multiple languages
export const SUIT_LABELS: Record<Suit, { ar: string; fr: string; en: string }> = {
  dhab: { ar: 'ذهب', fr: 'Or', en: 'Coins' },
  gobass: { ar: 'قوباص', fr: 'Coupes', en: 'Cups' },
  sif: { ar: 'سيف', fr: 'Épées', en: 'Swords' },
  gra3: { ar: 'قرع', fr: 'Bâtons', en: 'Clubs' },
}

// Card value labels
export const VALUE_LABELS: Record<number, { ar: string; fr: string; en: string }> = {
  1: { ar: 'آص', fr: 'As', en: 'Ace' },
  2: { ar: '٢', fr: '2', en: '2' },
  3: { ar: '٣', fr: '3', en: '3' },
  4: { ar: '٤', fr: '4', en: '4' },
  5: { ar: '٥', fr: '5', en: '5' },
  6: { ar: '٦', fr: '6', en: '6' },
  7: { ar: '٧', fr: '7', en: '7' },
  10: { ar: 'صوطا', fr: 'Sota', en: 'Sota' },
  11: { ar: 'كابايو', fr: 'Caballo', en: 'Caballo' },
  12: { ar: 'راي', fr: 'Rey', en: 'Rey' },
}

// Valid card values (no 8 or 9 in Moroccan deck)
export const VALID_VALUES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
export const SUITS: Suit[] = ['dhab', 'gobass', 'sif', 'gra3']

// Generate a complete deck
export function createDeck(): Card[] {
  const deck: Card[] = []
  
  for (const suit of SUITS) {
    for (const value of VALID_VALUES) {
      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        label: `${value} of ${suit}`,
        image: `/cards/${suit}/${value}.jpeg`,
      })
    }
  }
  
  return deck
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Deal cards to players
export function dealCards(
  deck: Card[],
  players: Player[],
  cardsPerPlayer: number
): { deck: Card[]; players: Player[] } {
  const newDeck = [...deck]
  const newPlayers = players.map(p => ({ ...p, hand: [...p.hand] }))
  
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const player of newPlayers) {
      const card = newDeck.pop()
      if (card) {
        player.hand.push(card)
      }
    }
  }
  
  return { deck: newDeck, players: newPlayers }
}

// Deal cards to table
export function dealToTable(deck: Card[], count: number): { deck: Card[]; tableCards: Card[] } {
  const newDeck = [...deck]
  const tableCards: Card[] = []
  
  for (let i = 0; i < count; i++) {
    const card = newDeck.pop()
    if (card) {
      tableCards.push(card)
    }
  }
  
  return { deck: newDeck, tableCards }
}

// Check if a card can capture another card (same value)
export function canCapture(playedCard: Card, tableCard: Card): boolean {
  return playedCard.value === tableCard.value
}

// Find all capturable cards on the table
export function findCapturableCards(playedCard: Card, tableCards: Card[]): Card[] {
  return tableCards.filter(tc => canCapture(playedCard, tc))
}

// Check for Ronda (2 cards of same value in hand)
export function checkRonda(hand: Card[]): Card[] | null {
  const valueGroups = new Map<number, Card[]>()
  
  for (const card of hand) {
    const group = valueGroups.get(card.value) || []
    group.push(card)
    valueGroups.set(card.value, group)
  }
  
  for (const [, cards] of valueGroups) {
    if (cards.length === 2) {
      return cards
    }
  }
  
  return null
}

// Check for Tringa (3 cards of same value in hand)
export function checkTringa(hand: Card[]): Card[] | null {
  const valueGroups = new Map<number, Card[]>()
  
  for (const card of hand) {
    const group = valueGroups.get(card.value) || []
    group.push(card)
    valueGroups.set(card.value, group)
  }
  
  for (const [, cards] of valueGroups) {
    if (cards.length === 3) {
      return cards
    }
  }
  
  return null
}

// Scoring constants
export const SCORING = {
  RONDA: 10,
  TRINGA: 20,
  MISSA: 5,
  MOST_CARDS: 3,
  MOST_DHAB: 5,
  CARD_VALUE_7_DHAB: 2,
}

// Calculate score for a player
export function calculateScore(player: Player, announcements: Announcement[]): number {
  let score = 0
  
  // Add announcement points
  for (const ann of announcements) {
    if (ann.playerId === player.id) {
      score += ann.points
    }
  }
  
  // Count dhab (coins) cards
  const dhabCards = player.captured.filter(c => c.suit === 'dhab')
  score += dhabCards.length
  
  // Bonus for 7 of dhab
  if (dhabCards.some(c => c.value === 7)) {
    score += SCORING.CARD_VALUE_7_DHAB
  }
  
  return score
}

// Create initial game state
export function createInitialGameState(playerNames: string[], aiPlayers: number = 0): GameState {
  const players: Player[] = []
  
  // Add human players
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
  
  // Add AI players
  for (let i = 0; i < aiPlayers; i++) {
    players.push({
      id: `ai-${i}`,
      name: `Bot ${i + 1}`,
      hand: [],
      captured: [],
      score: 0,
      isAI: true,
    })
  }
  
  return {
    deck: [],
    table: [],
    players,
    currentPlayerIndex: 0,
    round: 1,
    phase: 'waiting',
    lastCapture: null,
    announcements: [],
  }
}

// AI Logic - Basic strategy
export function getAIMove(hand: Card[], tableCards: Card[]): { card: Card; captures: Card[] } {
  // Priority 1: Capture multiple cards if possible
  for (const card of hand) {
    const captures = findCapturableCards(card, tableCards)
    if (captures.length > 1) {
      return { card, captures }
    }
  }
  
  // Priority 2: Capture dhab (coins) cards
  for (const card of hand) {
    const captures = findCapturableCards(card, tableCards)
    const dhabCaptures = captures.filter(c => c.suit === 'dhab')
    if (dhabCaptures.length > 0) {
      return { card, captures: dhabCaptures }
    }
  }
  
  // Priority 3: Any capture
  for (const card of hand) {
    const captures = findCapturableCards(card, tableCards)
    if (captures.length > 0) {
      return { card, captures }
    }
  }
  
  // Priority 4: Play lowest value card (keep high cards)
  const sortedHand = [...hand].sort((a, b) => a.value - b.value)
  return { card: sortedHand[0], captures: [] }
}
