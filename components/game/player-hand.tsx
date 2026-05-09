'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './card'
import type { Card as CardType, Player } from '@/lib/card-engine'
import { cn } from '@/lib/utils'

interface PlayerHandProps {
  player: Player
  isCurrentPlayer: boolean
  isHuman: boolean
  selectedCard?: string | null
  highlightedCards?: string[]
  onCardClick?: (card: CardType) => void
  position?: 'bottom' | 'top' | 'left' | 'right'
}

export function PlayerHand({
  player,
  isCurrentPlayer,
  isHuman,
  selectedCard,
  highlightedCards = [],
  onCardClick,
  position = 'bottom',
}: PlayerHandProps) {
  const isVertical = position === 'left' || position === 'right'
  
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2',
        isVertical && 'flex-row'
      )}
    >
      {/* Player info */}
      <motion.div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          isCurrentPlayer
            ? 'bg-amber-500 text-amber-950'
            : 'bg-zinc-800/80 text-zinc-300'
        )}
        animate={{
          scale: isCurrentPlayer ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: isCurrentPlayer ? Infinity : 0,
          repeatDelay: 1,
        }}
      >
        <span>{player.name}</span>
        <span className="px-2 py-0.5 bg-black/20 rounded-full text-xs">
          {player.captured.length} cartes
        </span>
      </motion.div>
      
      {/* Hand */}
      <div
        className={cn(
          'flex gap-2 p-2',
          isVertical && 'flex-col'
        )}
      >
        <AnimatePresence mode="popLayout">
          {player.hand.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ delay: index * 0.1 }}
              style={{
                marginLeft: !isVertical && index > 0 ? '-0.5rem' : 0,
                marginTop: isVertical && index > 0 ? '-1.5rem' : 0,
                zIndex: index,
              }}
            >
              <Card
                card={card}
                faceDown={!isHuman}
                selected={selectedCard === card.id}
                highlighted={highlightedCards.includes(card.id)}
                disabled={!isCurrentPlayer || !isHuman}
                onClick={() => isHuman && onCardClick?.(card)}
                size={position === 'bottom' ? 'lg' : 'md'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {player.hand.length === 0 && (
          <div className="text-zinc-500 text-sm italic px-4 py-2">
            Pas de cartes
          </div>
        )}
      </div>
    </div>
  )
}
