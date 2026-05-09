'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/lib/game-store'
import { RondaGame } from '@/components/game/ronda-game'
import { generateRoomId } from '@/lib/multiplayer/types'
import { 
  Spade, 
  Heart, 
  Diamond, 
  Club,
  Users,
  Bot,
  BookOpen,
  Play,
  Globe,
  Link
} from 'lucide-react'

type GameMode = 'menu' | 'setup' | 'multiplayer-setup' | 'playing' | 'rules'

export default function HomePage() {
  const [mode, setMode] = useState<GameMode>('menu')
  const [playerName, setPlayerName] = useState('')
  const [aiCount, setAiCount] = useState(1)
  const [joinCode, setJoinCode] = useState('')
  const { initGame } = useGameStore()
  const router = useRouter()
  
  const handleStartGame = () => {
    const name = playerName.trim() || 'Joueur'
    initGame([name], aiCount)
    setMode('playing')
  }
  
  const handleCreateRoom = () => {
    const roomId = generateRoomId()
    router.push(`/room/${roomId}`)
  }
  
  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length >= 4) {
      router.push(`/room/${code}`)
    }
  }
  
  if (mode === 'playing') {
    return <RondaGame onExit={() => setMode('menu')} />
  }
  
  if (mode === 'rules') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setMode('menu')}
            className="mb-6 text-zinc-400 hover:text-white"
          >
            Retour
          </Button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Regles de la Ronda</h1>
            
            <div className="space-y-6 text-zinc-300">
              <section>
                <h2 className="text-xl font-semibold text-amber-300 mb-2">Le Deck</h2>
                <p>40 cartes espagnoles/marocaines sans les 8 et 9.</p>
                <p className="mt-2">4 couleurs : Dhab (Or), Gobass (Coupes), Sif (Epees), Gra3 (Batons)</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-amber-300 mb-2">Distribution</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>2 a 4 joueurs</li>
                  <li>3 cartes par joueur</li>
                  <li>4 cartes sur la table</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-amber-300 mb-2">Comment Jouer</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Capturez une carte de la table avec une carte de meme valeur</li>
                  <li>Si pas de capture possible, posez votre carte sur la table</li>
                  <li>Les cartes capturees vont dans votre pile</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-amber-300 mb-2">Annonces Speciales</h2>
                <div className="space-y-3">
                  <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30">
                    <h3 className="font-semibold text-amber-400">Ronda (+10 points)</h3>
                    <p>2 cartes de meme valeur dans votre main</p>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <h3 className="font-semibold text-red-400">Tringa (+20 points)</h3>
                    <p>3 cartes de meme valeur dans votre main</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/30">
                    <h3 className="font-semibold text-emerald-400">Missa (+5 points)</h3>
                    <p>Vider completement la table en capturant</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-amber-300 mb-2">Points</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>1 point par carte Dhab (Or) capturee</li>
                  <li>+2 points pour le 7 de Dhab</li>
                  <li>+3 points pour le plus de cartes capturees</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  if (mode === 'multiplayer-setup') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-zinc-800"
        >
          <Button
            variant="ghost"
            onClick={() => setMode('menu')}
            className="mb-4 text-zinc-400 hover:text-white"
          >
            Retour
          </Button>
          
          <h2 className="text-2xl font-bold text-amber-400 mb-6">Multijoueur</h2>
          
          <div className="space-y-6">
            <Button
              onClick={handleCreateRoom}
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold py-6"
            >
              <Globe className="w-5 h-5 mr-2" />
              Creer une partie
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">ou</span>
              </div>
            </div>
            
            <div>
              <label className="block text-zinc-300 mb-2">Rejoindre avec un code</label>
              <div className="flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE123"
                  maxLength={8}
                  className="bg-zinc-800 border-zinc-700 text-white uppercase tracking-widest text-center text-lg"
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={joinCode.trim().length < 4}
                  className="bg-zinc-700 hover:bg-zinc-600"
                >
                  <Link className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }
  
  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-zinc-800"
        >
          <Button
            variant="ghost"
            onClick={() => setMode('menu')}
            className="mb-4 text-zinc-400 hover:text-white"
          >
            Retour
          </Button>
          
          <h2 className="text-2xl font-bold text-amber-400 mb-6">Configuration</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-300 mb-2">Votre Nom</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Entrez votre nom"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div>
              <label className="block text-zinc-300 mb-2">Adversaires IA</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(count => (
                  <Button
                    key={count}
                    variant={aiCount === count ? 'default' : 'outline'}
                    onClick={() => setAiCount(count)}
                    className={aiCount === count 
                      ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' 
                      : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'}
                  >
                    <Bot className="w-4 h-4 mr-1" />
                    {count}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleStartGame}
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Commencer
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }
  
  // Main Menu
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Moroccan pattern background */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24'%3E%3Cpath d='M40 0l40 40-40 40L0 40 40 0zm0 10L10 40l30 30 30-30-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Animated cards decoration */}
      <div className="absolute top-10 left-10 opacity-20">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Spade className="w-16 h-16 text-amber-400" />
        </motion.div>
      </div>
      <div className="absolute top-10 right-10 opacity-20">
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Heart className="w-16 h-16 text-red-400" />
        </motion.div>
      </div>
      <div className="absolute bottom-10 left-10 opacity-20">
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        >
          <Diamond className="w-16 h-16 text-amber-400" />
        </motion.div>
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 3 }}
        >
          <Club className="w-16 h-16 text-emerald-400" />
        </motion.div>
      </div>
      
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-2">
          Moroccan Cards
        </h1>
        <p className="text-zinc-400 text-lg">Jeux de Cartes Marocains</p>
      </motion.div>
      
      {/* Menu buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 w-full max-w-sm relative z-10"
      >
        <Button
          onClick={() => setMode('setup')}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-semibold py-6 text-lg"
        >
          <Bot className="w-5 h-5 mr-2" />
          Jouer contre IA
        </Button>
        
        <Button
          onClick={() => setMode('multiplayer-setup')}
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-emerald-950 font-semibold py-6 text-lg"
        >
          <Globe className="w-5 h-5 mr-2" />
          Multijoueur en ligne
        </Button>
        
        <Button
          onClick={() => setMode('rules')}
          size="lg"
          variant="outline"
          className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 py-6 text-lg"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Regles du Jeu
        </Button>
        
        {/* Coming soon games */}
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-center text-zinc-500 mb-4">Bientot disponible</p>
          <div className="grid grid-cols-2 gap-2">
            {['Tringa', 'Haz 2', 'Khamssa', 'Tbourida'].map(game => (
              <Button
                key={game}
                variant="ghost"
                disabled
                className="text-zinc-600 hover:text-zinc-500"
              >
                {game}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
