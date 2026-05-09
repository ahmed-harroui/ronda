'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  useGameState, 
  useRoomState, 
  useGameActions,
  useIsMyTurn,
  useMultiplayerStore
} from '@/lib/multiplayer'
import { Card } from '@/components/game/card'
import { Crown, Timer, Trophy } from 'lucide-react'

export function MultiplayerGame() {
  const { myHand, table, currentPlayer, scores, roundScores, round, lastAnnouncement } = useGameState()
  const { players } = useRoomState()
  const { playCard, announce } = useGameActions()
  const isMyTurn = useIsMyTurn()
  const playerId = useMultiplayerStore(state => state.playerId)
  
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [selectedTableCards, setSelectedTableCards] = useState<string[]>([])
  
  const currentPlayerName = players.find(p => p.id === currentPlayer)?.name || 'Joueur'
  const myPlayer = players.find(p => p.id === playerId)

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return
    setSelectedCard(cardId)
    setSelectedTableCards([])
  }

  const handleTableCardClick = (cardId: string) => {
    if (!isMyTurn || !selectedCard) return
    
    setSelectedTableCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(c => c !== cardId)
        : [...prev, cardId]
    )
  }

  const handlePlay = () => {
    if (!selectedCard) return
    
    playCard(selectedCard, selectedTableCards.length > 0 ? selectedTableCards : undefined)
    setSelectedCard(null)
    setSelectedTableCards([])
  }

  const handleAnnounce = (type: 'ronda' | 'tringa') => {
    announce(type)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-900 to-emerald-950">
      {/* Announcement overlay */}
      <AnimatePresence>
        {lastAnnouncement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="bg-amber-500 text-black px-8 py-4 rounded-xl text-3xl font-bold">
              {lastAnnouncement.type.toUpperCase()}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar - Scores */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-zinc-300 text-sm">Manche {round}</span>
        </div>
        
        <div className="flex gap-4">
          {players.map(player => (
            <div 
              key={player.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                player.id === currentPlayer ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'bg-zinc-800/50'
              }`}
            >
              <span className="text-lg">{player.avatar}</span>
              <span className="text-zinc-300 text-sm">{player.name}</span>
              <span className="text-amber-400 font-bold">{scores[player.id] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col">
        {/* Opponent area */}
        <div className="flex justify-center p-4">
          {players.filter(p => p.id !== playerId).map(opponent => (
            <div key={opponent.id} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{opponent.avatar}</span>
                <span className="text-zinc-300">{opponent.name}</span>
                {opponent.id === currentPlayer && (
                  <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
                )}
              </div>
              {/* Hidden cards */}
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className="w-12 h-16 bg-gradient-to-br from-red-800 to-red-900 rounded border-2 border-red-700"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-emerald-800/50 rounded-3xl p-8 min-w-[300px] min-h-[200px] border-4 border-emerald-700">
            <div className="flex flex-wrap justify-center gap-3">
              {table.map(cardId => (
                <motion.div
                  key={cardId}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  onClick={() => handleTableCardClick(cardId)}
                  className={`cursor-pointer transition-transform ${
                    selectedTableCards.includes(cardId) 
                      ? 'ring-4 ring-amber-400 scale-110' 
                      : 'hover:scale-105'
                  }`}
                >
                  <Card cardId={cardId} size="md" />
                </motion.div>
              ))}
              {table.length === 0 && (
                <p className="text-emerald-500/50 text-sm">Table vide</p>
              )}
            </div>
          </div>
        </div>

        {/* Current turn indicator */}
        <div className="text-center py-2">
          {isMyTurn ? (
            <span className="text-amber-400 font-medium">C&apos;est votre tour</span>
          ) : (
            <span className="text-zinc-400">Tour de {currentPlayerName}</span>
          )}
        </div>

        {/* Player hand */}
        <div className="p-4 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{myPlayer?.avatar}</span>
              <span className="text-zinc-300">{myPlayer?.name}</span>
              {myPlayer?.isHost && <Crown className="w-4 h-4 text-amber-500" />}
            </div>
            
            {/* Announce buttons */}
            {isMyTurn && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAnnounce('ronda')}
                  className="text-amber-400 border-amber-400"
                >
                  Ronda
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAnnounce('tringa')}
                  className="text-amber-400 border-amber-400"
                >
                  Tringa
                </Button>
              </div>
            )}
          </div>

          {/* Hand */}
          <div className="flex justify-center gap-2 mb-4">
            {myHand.map(cardId => (
              <motion.div
                key={cardId}
                whileHover={isMyTurn ? { y: -10 } : {}}
                onClick={() => handleCardClick(cardId)}
                className={`cursor-pointer transition-all ${
                  selectedCard === cardId 
                    ? 'ring-4 ring-amber-400 scale-110' 
                    : ''
                } ${!isMyTurn ? 'opacity-70' : ''}`}
              >
                <Card cardId={cardId} size="lg" />
              </motion.div>
            ))}
          </div>

          {/* Play button */}
          {selectedCard && isMyTurn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <Button
                onClick={handlePlay}
                className="bg-amber-600 hover:bg-amber-700 px-8"
              >
                {selectedTableCards.length > 0 
                  ? `Capturer ${selectedTableCards.length} carte${selectedTableCards.length > 1 ? 's' : ''}` 
                  : 'Poser la carte'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
