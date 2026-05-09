'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './card'
import type { Card as CardType } from '@/lib/card-engine'

interface TableProps {
  cards: CardType[]
  highlightedCards?: string[]
  onCardClick?: (card: CardType) => void
}

export function Table({ cards, highlightedCards = [], onCardClick }: TableProps) {
  return (
    <div className="relative w-full aspect-[16/10] max-w-2xl mx-auto">
      {/* Table surface */}
      <div className="absolute inset-0 bg-emerald-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Moroccan pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Inner felt */}
        <div className="absolute inset-4 bg-emerald-700 rounded-2xl border-4 border-amber-600/30" />
      </div>
      
      {/* Cards on table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-wrap gap-3 justify-center items-center p-8">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: 0,
                  rotate: (index % 2 === 0 ? -1 : 1) * (Math.random() * 5),
                }}
                exit={{ opacity: 0, scale: 0, y: -50 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.1,
                }}
              >
                <Card
                  card={card}
                  highlighted={highlightedCards.includes(card.id)}
                  onClick={() => onCardClick?.(card)}
                  size="lg"
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {cards.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-400/50 text-lg font-medium"
            >
              Table vide
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
