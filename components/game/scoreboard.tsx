'use client'

import { motion } from 'framer-motion'
import type { Player } from '@/lib/card-engine'
import { Trophy, Medal, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScoreboardProps {
  players: Player[]
  onNewGame: () => void
  onMainMenu: () => void
}

export function Scoreboard({ players, onNewGame, onMainMenu }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-zinc-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-700" />
      default:
        return <span className="w-6 h-6 text-zinc-500 font-bold">{index + 1}</span>
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-zinc-800"
    >
      <h2 className="text-3xl font-bold text-center mb-6 text-amber-400">
        Fin de la Manche
      </h2>
      
      <div className="space-y-3 mb-8">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-xl ${
              index === 0
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30'
                : 'bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">{player.name}</div>
              <div className="text-sm text-zinc-400">
                {player.captured.length} cartes capturees
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {player.score}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onMainMenu}
          className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Menu Principal
        </Button>
        <Button
          onClick={onNewGame}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
        >
          Nouvelle Partie
        </Button>
      </div>
    </motion.div>
  )
}
