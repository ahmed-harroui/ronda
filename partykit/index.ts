import type * as Party from "partykit/server"
import type {
  ClientMessage,
  ServerMessage,
  RoomState,
  Player,
  MultiplayerGameState,
  RoomSettings,
} from "../lib/multiplayer/types"
import { DEFAULT_ROOM_SETTINGS } from "../lib/multiplayer/types"

// Constantes du jeu
const SUITS = ['dhab', 'gobass', 'sif', 'gra3'] as const
const VALUES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

function createDeck(): string[] {
  const deck: string[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push(`${suit}-${value}`)
    }
  }
  return deck
}

function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCardValue(cardId: string): number {
  const value = parseInt(cardId.split('-')[1])
  return value
}

function canCapture(playedCard: string, tableCards: string[]): string[][] {
  const playedValue = getCardValue(playedCard)
  const captures: string[][] = []
  
  // Capture directe (meme valeur)
  for (const card of tableCards) {
    if (getCardValue(card) === playedValue) {
      captures.push([card])
    }
  }
  
  // Capture par somme (combinaisons)
  if (tableCards.length >= 2) {
    for (let i = 0; i < tableCards.length; i++) {
      for (let j = i + 1; j < tableCards.length; j++) {
        const sum = getCardValue(tableCards[i]) + getCardValue(tableCards[j])
        if (sum === playedValue) {
          captures.push([tableCards[i], tableCards[j]])
        }
      }
    }
    
    // Combinaisons de 3 cartes
    if (tableCards.length >= 3) {
      for (let i = 0; i < tableCards.length; i++) {
        for (let j = i + 1; j < tableCards.length; j++) {
          for (let k = j + 1; k < tableCards.length; k++) {
            const sum = getCardValue(tableCards[i]) + getCardValue(tableCards[j]) + getCardValue(tableCards[k])
            if (sum === playedValue) {
              captures.push([tableCards[i], tableCards[j], tableCards[k]])
            }
          }
        }
      }
    }
  }
  
  return captures
}

function calculateRoundScore(capturedCards: string[]): { cards: number; dhab: number; spitta: number; total: number } {
  let dhab = 0
  let spitta = 0
  
  for (const card of capturedCards) {
    const [suit, valueStr] = card.split('-')
    const value = parseInt(valueStr)
    
    if (suit === 'dhab') {
      dhab++
      if (value === 7) dhab++ // 7 d'or vaut 2 points
    }
    
    if (suit === 'dhab' && value === 7) spitta = 1 // Sbitta (7 d'or)
  }
  
  const cards = capturedCards.length >= 21 ? 1 : 0
  
  return { cards, dhab: dhab >= 5 ? 1 : 0, spitta, total: cards + (dhab >= 5 ? 1 : 0) + spitta }
}

export default class RondaRoom implements Party.Server {
  constructor(public room: Party.Room) {}

  private state: RoomState = {
    roomId: '',
    hostId: '',
    players: [],
    settings: { ...DEFAULT_ROOM_SETTINGS },
    phase: 'lobby',
    gameState: null,
    createdAt: Date.now(),
  }

  async onStart() {
    this.state.roomId = this.room.id
    // Charger l'état persisté si disponible
    const stored = await this.room.storage.get<RoomState>('state')
    if (stored) {
      this.state = stored
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Envoyer l'état actuel au nouveau connecté
    this.send(conn, { type: 'room-state', payload: this.state })
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message)
      await this.handleMessage(msg, sender)
    } catch (error) {
      this.send(sender, { 
        type: 'error', 
        payload: { code: 'INVALID_MESSAGE', message: 'Message invalide' } 
      })
    }
  }

  async onClose(conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (player) {
      player.status = 'disconnected'
      this.broadcast({ type: 'player-left', payload: { playerId: conn.id } })
      
      // Si c'est l'hôte qui part, transférer à un autre joueur
      if (player.isHost && this.state.players.length > 1) {
        const newHost = this.state.players.find(p => p.id !== conn.id && p.status !== 'disconnected')
        if (newHost) {
          newHost.isHost = true
          this.state.hostId = newHost.id
          this.broadcastState()
        }
      }
      
      await this.saveState()
    }
  }

  private async handleMessage(msg: ClientMessage, sender: Party.Connection) {
    switch (msg.type) {
      case 'join':
        await this.handleJoin(msg.payload, sender)
        break
      case 'leave':
        await this.handleLeave(sender)
        break
      case 'ready':
        await this.handleReady(sender, true)
        break
      case 'not-ready':
        await this.handleReady(sender, false)
        break
      case 'start-game':
        await this.handleStartGame(sender)
        break
      case 'play-card':
        await this.handlePlayCard(msg.payload, sender)
        break
      case 'announce':
        await this.handleAnnounce(msg.payload, sender)
        break
      case 'update-settings':
        await this.handleUpdateSettings(msg.payload, sender)
        break
      case 'kick-player':
        await this.handleKickPlayer(msg.payload, sender)
        break
      case 'chat':
        await this.handleChat(msg.payload, sender)
        break
      case 'ping':
        this.send(sender, { type: 'pong' })
        break
    }
  }

  private async handleJoin(payload: { name: string; avatar: string }, conn: Party.Connection) {
    // Vérifier si le joueur existe déjà (reconnexion)
    const existingPlayer = this.state.players.find(p => p.id === conn.id)
    if (existingPlayer) {
      existingPlayer.status = 'connected'
      existingPlayer.name = payload.name
      existingPlayer.avatar = payload.avatar
      this.broadcastState()
      
      // Si le jeu est en cours, renvoyer sa main
      if (this.state.gameState && this.state.gameState.hands[conn.id]) {
        this.send(conn, { type: 'your-hand', payload: { cards: this.state.gameState.hands[conn.id] } })
      }
      return
    }

    // Vérifier si la room est pleine
    const activePlayers = this.state.players.filter(p => p.status !== 'disconnected')
    if (activePlayers.length >= this.state.settings.maxPlayers) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'ROOM_FULL', message: 'La partie est complète' } 
      })
      return
    }

    // Créer le nouveau joueur
    const isHost = this.state.players.length === 0
    const player: Player = {
      id: conn.id,
      name: payload.name,
      avatar: payload.avatar,
      status: 'connected',
      isHost,
      position: this.state.players.length,
    }

    if (isHost) {
      this.state.hostId = conn.id
    }

    this.state.players.push(player)
    
    this.broadcast({ type: 'player-joined', payload: player })
    this.broadcastState()
    await this.saveState()
  }

  private async handleLeave(conn: Party.Connection) {
    const playerIndex = this.state.players.findIndex(p => p.id === conn.id)
    if (playerIndex !== -1) {
      this.state.players.splice(playerIndex, 1)
      this.broadcast({ type: 'player-left', payload: { playerId: conn.id } })
      this.broadcastState()
      await this.saveState()
    }
  }

  private async handleReady(conn: Party.Connection, ready: boolean) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (player) {
      player.status = ready ? 'ready' : 'connected'
      this.broadcast({ type: 'player-ready', payload: { playerId: conn.id, ready } })
      this.broadcastState()
      await this.saveState()
    }
  }

  private async handleStartGame(conn: Party.Connection) {
    // Vérifier que c'est l'hôte
    if (conn.id !== this.state.hostId) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'NOT_HOST', message: 'Seul l\'hôte peut démarrer la partie' } 
      })
      return
    }

    // Vérifier que tous sont prêts
    const readyPlayers = this.state.players.filter(p => p.status === 'ready' || p.isHost)
    if (readyPlayers.length < 2) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'NOT_ENOUGH_PLAYERS', message: 'Au moins 2 joueurs doivent être prêts' } 
      })
      return
    }

    // Initialiser le jeu
    this.state.phase = 'playing'
    const deck = shuffleDeck(createDeck())
    
    const hands: Record<string, string[]> = {}
    const capturedCards: Record<string, string[]> = {}
    const scores: Record<string, number> = {}
    const roundScores: Record<string, number> = {}
    
    // Distribuer 3 cartes à chaque joueur
    let cardIndex = 0
    for (const player of this.state.players) {
      hands[player.id] = deck.slice(cardIndex, cardIndex + 3)
      cardIndex += 3
      capturedCards[player.id] = []
      scores[player.id] = 0
      roundScores[player.id] = 0
      player.status = 'playing'
    }

    // 4 cartes sur la table
    const table = deck.slice(cardIndex, cardIndex + 4)
    cardIndex += 4

    this.state.gameState = {
      deck: deck.slice(cardIndex),
      table,
      hands,
      scores,
      roundScores,
      currentPlayer: this.state.players[0].id,
      lastCapture: null,
      capturedCards,
      announcements: [],
      round: 1,
      phase: 'playing',
    }

    // Envoyer l'état du jeu à tous (sans les mains des autres)
    this.broadcast({ type: 'game-started', payload: this.getPublicGameState() })
    
    // Envoyer à chaque joueur sa main
    for (const player of this.state.players) {
      const conn = this.room.getConnection(player.id)
      if (conn) {
        this.send(conn, { type: 'your-hand', payload: { cards: hands[player.id] } })
      }
    }

    await this.saveState()
  }

  private async handlePlayCard(payload: { cardId: string; targetCardIds?: string[] }, conn: Party.Connection) {
    const game = this.state.gameState
    if (!game || game.currentPlayer !== conn.id) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'NOT_YOUR_TURN', message: 'Ce n\'est pas votre tour' } 
      })
      return
    }

    const hand = game.hands[conn.id]
    if (!hand.includes(payload.cardId)) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'INVALID_CARD', message: 'Vous n\'avez pas cette carte' } 
      })
      return
    }

    // Retirer la carte de la main
    const cardIndex = hand.indexOf(payload.cardId)
    hand.splice(cardIndex, 1)

    let captured: string[] = []
    
    if (payload.targetCardIds && payload.targetCardIds.length > 0) {
      // Vérifier que la capture est valide
      const possibleCaptures = canCapture(payload.cardId, game.table)
      const isValidCapture = possibleCaptures.some(
        cap => cap.length === payload.targetCardIds!.length && 
               cap.every(c => payload.targetCardIds!.includes(c))
      )
      
      if (isValidCapture) {
        captured = payload.targetCardIds
        // Retirer les cartes capturées de la table
        game.table = game.table.filter(c => !captured.includes(c))
        // Ajouter les cartes capturées
        game.capturedCards[conn.id].push(payload.cardId, ...captured)
        game.lastCapture = conn.id
        
        // Vérifier Missa (table vide)
        if (game.table.length === 0) {
          game.roundScores[conn.id] = (game.roundScores[conn.id] || 0) + 1
          game.announcements.push({ playerId: conn.id, type: 'missa', timestamp: Date.now() })
        }
      } else {
        // Capture invalide, poser la carte
        game.table.push(payload.cardId)
      }
    } else {
      // Poser la carte sur la table
      game.table.push(payload.cardId)
    }

    // Broadcast le coup joué
    this.broadcast({ 
      type: 'card-played', 
      payload: { playerId: conn.id, cardId: payload.cardId, captured } 
    })

    // Passer au joueur suivant
    const currentIndex = this.state.players.findIndex(p => p.id === conn.id)
    const nextIndex = (currentIndex + 1) % this.state.players.length
    game.currentPlayer = this.state.players[nextIndex].id

    // Vérifier si les mains sont vides
    const allHandsEmpty = Object.values(game.hands).every(h => h.length === 0)
    
    if (allHandsEmpty) {
      if (game.deck.length > 0) {
        // Redistribuer
        await this.dealNewCards()
      } else {
        // Fin du round
        await this.endRound()
      }
    }

    this.broadcastState()
    await this.saveState()
  }

  private async dealNewCards() {
    const game = this.state.gameState!
    
    for (const player of this.state.players) {
      const cards = game.deck.splice(0, 3)
      game.hands[player.id] = cards
      
      const conn = this.room.getConnection(player.id)
      if (conn) {
        this.send(conn, { type: 'your-hand', payload: { cards } })
      }
    }
  }

  private async endRound() {
    const game = this.state.gameState!
    
    // Donner les cartes restantes au dernier capteur
    if (game.lastCapture && game.table.length > 0) {
      game.capturedCards[game.lastCapture].push(...game.table)
      game.table = []
    }

    // Calculer les scores
    for (const player of this.state.players) {
      const roundResult = calculateRoundScore(game.capturedCards[player.id])
      game.roundScores[player.id] += roundResult.total
      game.scores[player.id] += game.roundScores[player.id]
    }

    // Vérifier si quelqu'un a gagné
    const winner = this.state.players.find(p => game.scores[p.id] >= this.state.settings.targetScore)
    
    if (winner) {
      game.phase = 'finished'
      this.state.phase = 'finished'
      this.broadcast({ 
        type: 'game-end', 
        payload: { winner: winner.id, finalScores: game.scores } 
      })
    } else {
      // Nouveau round
      game.round++
      const deck = shuffleDeck(createDeck())
      
      let cardIndex = 0
      for (const player of this.state.players) {
        game.hands[player.id] = deck.slice(cardIndex, cardIndex + 3)
        cardIndex += 3
        game.capturedCards[player.id] = []
        game.roundScores[player.id] = 0
      }
      
      game.table = deck.slice(cardIndex, cardIndex + 4)
      cardIndex += 4
      game.deck = deck.slice(cardIndex)
      game.lastCapture = null
      game.announcements = []
      
      this.broadcast({ type: 'round-end', payload: { scores: game.scores, roundScores: game.roundScores } })
      
      // Envoyer les nouvelles mains
      for (const player of this.state.players) {
        const conn = this.room.getConnection(player.id)
        if (conn) {
          this.send(conn, { type: 'your-hand', payload: { cards: game.hands[player.id] } })
        }
      }
    }

    await this.saveState()
  }

  private async handleAnnounce(payload: { type: 'ronda' | 'tringa' | 'missa' }, conn: Party.Connection) {
    const game = this.state.gameState
    if (!game) return

    const announcement = {
      playerId: conn.id,
      type: payload.type,
      timestamp: Date.now(),
    }
    
    game.announcements.push(announcement)
    
    // Points pour les annonces
    const points = payload.type === 'ronda' ? 1 : payload.type === 'tringa' ? 2 : 1
    game.roundScores[conn.id] = (game.roundScores[conn.id] || 0) + points
    
    this.broadcast({ type: 'announcement', payload: announcement })
    await this.saveState()
  }

  private async handleUpdateSettings(payload: Partial<RoomSettings>, conn: Party.Connection) {
    if (conn.id !== this.state.hostId) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'NOT_HOST', message: 'Seul l\'hôte peut modifier les paramètres' } 
      })
      return
    }

    this.state.settings = { ...this.state.settings, ...payload }
    this.broadcastState()
    await this.saveState()
  }

  private async handleKickPlayer(payload: { playerId: string }, conn: Party.Connection) {
    if (conn.id !== this.state.hostId) {
      this.send(conn, { 
        type: 'error', 
        payload: { code: 'NOT_HOST', message: 'Seul l\'hôte peut exclure des joueurs' } 
      })
      return
    }

    const playerIndex = this.state.players.findIndex(p => p.id === payload.playerId)
    if (playerIndex !== -1) {
      this.state.players.splice(playerIndex, 1)
      this.broadcast({ type: 'player-left', payload: { playerId: payload.playerId } })
      this.broadcastState()
      await this.saveState()
    }
  }

  private async handleChat(payload: { message: string }, conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (player) {
      this.broadcast({ 
        type: 'chat', 
        payload: { 
          playerId: conn.id, 
          playerName: player.name, 
          message: payload.message,
          timestamp: Date.now()
        } 
      })
    }
  }

  private getPublicGameState(): MultiplayerGameState {
    const game = this.state.gameState!
    return {
      ...game,
      deck: [], // Ne pas révéler le deck
      hands: {}, // Ne pas révéler les mains
    }
  }

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  private broadcastState() {
    const stateToSend: RoomState = {
      ...this.state,
      gameState: this.state.gameState ? this.getPublicGameState() : null,
    }
    this.broadcast({ type: 'room-state', payload: stateToSend })
  }

  private async saveState() {
    await this.room.storage.put('state', this.state)
  }
}
