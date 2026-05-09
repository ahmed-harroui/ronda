'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/lib/game-store'
import { Table } from './table'
import { PlayerHand } from './player-hand'
import { AnnouncementOverlay } from './announcement-overlay'
import { Scoreboard } from './scoreboard'
import { checkRonda, checkTringa, findCapturableCards } from '@/lib/card-engine'
import type { Card as CardType } from '@/lib/card-engine'
import { Button } from '@/components/ui/button'
import { Sparkles, Trophy } from 'lucide-react'

interface RondaGameProps {
  onExit: () => void
}

export function RondaGame({ onExit }: RondaGameProps) {
  const {
    players,
    table,
    currentPlayerIndex,
    phase,
    announcements,
    startRound,
    playCard,
    announceRonda,
    announceTringa,
    resetGame,
  } = useGameStore()
  
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [highlightedTableCards, setHighlightedTableCards] = useState<string[]>([])
  const [showAnnouncementButtons, setShowAnnouncementButtons] = useState(true)
  
  const currentPlayer = players[currentPlayerIndex]
  const humanPlayer = players.find(p => !p.isAI)
  const isHumanTurn = currentPlayer && !currentPlayer.isAI
  
  // Check if human can announce
  const canAnnounceRonda = humanPlayer && checkRonda(humanPlayer.hand)
  const canAnnounceTringa = humanPlayer && checkTringa(humanPlayer.hand)
  const hasAnnouncedRonda = humanPlayer && announcements.some(
    a => a.playerId === humanPlayer.id && a.type === 'ronda'
  )
  const hasAnnouncedTringa = humanPlayer && announcements.some(
    a => a.playerId === humanPlayer.id && a.type === 'tringa'
  )
  
  const handleCardSelect = (card: CardType) => {
    if (!isHumanTurn) return
    
    if (selectedCard?.id === card.id) {
      // Deselect
      setSelectedCard(null)
      setHighlightedTableCards([])
    } else {
      // Select and highlight capturable cards
      setSelectedCard(card)
      const capturable = findCapturableCards(card, table)
      setHighlightedTableCards(capturable.map(c => c.id))
    }
  }
  
  const handleTableCardClick = (tableCard: CardType) => {
    if (!selectedCard || !isHumanTurn) return
    
    const capturable = findCapturableCards(selectedCard, table)
    
    if (capturable.some(c => c.id === tableCard.id)) {
      // Play the card and capture
      playCard(selectedCard, capturable)
      setSelectedCard(null)
      setHighlightedTableCards([])
    }
  }
  
  const handlePlayWithoutCapture = () => {
    if (!selectedCard || !isHumanTurn) return
    
    const capturable = findCapturableCards(selectedCard, table)
    
    if (capturable.length === 0) {
      // No captures possible - just play the card
      playCard(selectedCard, [])
      setSelectedCard(null)
      setHighlightedTableCards([])
    }
  }
  
  const handleNewGame = () => {
    startRound()
    setShowAnnouncementButtons(true)
  }
  
  const handleMainMenu = () => {
    resetGame()
    onExit()
  }
  
  // Start game if not started
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-amber-400 mb-6">Ronda</h2>
          <Button
            onClick={handleNewGame}
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-8"
          >
            Commencer la Partie
          </Button>
        </motion.div>
      </div>
    )
  }
  
  // Show scoreboard at end of round
  if (phase === 'scoring') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Scoreboard
          players={players}
          onNewGame={handleNewGame}
          onMainMenu={handleMainMenu}
        />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Announcement overlay */}
      {announcements.length > 0 && (
        <AnnouncementOverlay
          announcements={announcements}
          players={players}
        />
      )}
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleMainMenu}
          className="text-zinc-400 hover:text-white"
        >
          Quitter
        </Button>
        <div className="text-amber-400 font-semibold">
          Tour: {currentPlayer?.name}
        </div>
        <div className="text-zinc-400">
          {humanPlayer && `Score: ${humanPlayer.score}`}
        </div>
      </div>
      
      {/* AI players at top */}
      <div className="flex justify-center gap-8 p-4">
        {players.filter(p => p.isAI).map(player => (
          <PlayerHand
            key={player.id}
            player={player}
            isCurrentPlayer={players[currentPlayerIndex]?.id === player.id}
            isHuman={false}
            position="top"
          />
        ))}
      </div>
      
      {/* Table */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Table
          cards={table}
          highlightedCards={highlightedTableCards}
          onCardClick={handleTableCardClick}
        />
      </div>
      
      {/* Action buttons */}
      {isHumanTurn && selectedCard && (
        <div className="flex justify-center gap-3 p-2">
          {highlightedTableCards.length > 0 ? (
            <Button
              onClick={() => {
                const capturable = findCapturableCards(selectedCard, table)
                playCard(selectedCard, capturable)
                setSelectedCard(null)
                setHighlightedTableCards([])
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Capturer ({highlightedTableCards.length} cartes)
            </Button>
          ) : (
            <Button
              onClick={handlePlayWithoutCapture}
              className="bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Poser la carte
            </Button>
          )}
        </div>
      )}
      
      {/* Announcement buttons */}
      {showAnnouncementButtons && humanPlayer && isHumanTurn && (
        <div className="flex justify-center gap-3 p-2">
          {canAnnounceTringa && !hasAnnouncedTringa && (
            <Button
              onClick={() => {
                announceTringa(humanPlayer.id)
                setShowAnnouncementButtons(false)
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Annoncer Tringa!
            </Button>
          )}
          {canAnnounceRonda && !hasAnnouncedRonda && !canAnnounceTringa && (
            <Button
              onClick={() => {
                announceRonda(humanPlayer.id)
                setShowAnnouncementButtons(false)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Annoncer Ronda!
            </Button>
          )}
        </div>
      )}
      
      {/* Human player hand at bottom */}
      {humanPlayer && (
        <div className="p-4 flex justify-center">
          <PlayerHand
            player={humanPlayer}
            isCurrentPlayer={players[currentPlayerIndex]?.id === humanPlayer.id}
            isHuman={true}
            selectedCard={selectedCard?.id}
            onCardClick={handleCardSelect}
            position="bottom"
          />
        </div>
      )}
    </div>
  )
}
