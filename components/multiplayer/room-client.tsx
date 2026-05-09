'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  usePartyConnection,
  useRoomState,
  usePlayerInfo,
  useMultiplayerStore,
  AVATARS
} from '@/lib/multiplayer'
import { Lobby } from './lobby'
import { MultiplayerGame } from './multiplayer-game'
import { Loader2 } from 'lucide-react'

interface RoomClientProps {
  roomId: string
}

export function RoomClient({ roomId }: RoomClientProps) {
  const { connectionStatus, isConnected, isConnecting, error } = usePartyConnection(roomId)
  const { phase, players } = useRoomState()
  const { setPlayerInfo, playerName, playerAvatar, playerId } = usePlayerInfo()
  const joinRoom = useMultiplayerStore(state => state.joinRoom)
  
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [hasJoined, setHasJoined] = useState(false)

  // Check if already in room
  const isInRoom = players.some(p => p.id === playerId)

  const handleJoin = () => {
    if (!name.trim()) return
    
    setPlayerInfo(name, avatar)
    joinRoom()
    setHasJoined(true)
  }

  // If connected but not in room, show join form
  if (isConnected && !isInRoom && !hasJoined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-800"
        >
          <h1 className="text-2xl font-bold text-zinc-100 mb-6 text-center">
            Rejoindre la partie
          </h1>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300">Votre nom</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
                className="mt-2 bg-zinc-800 border-zinc-700"
                maxLength={20}
              />
            </div>
            
            <div>
              <Label className="text-zinc-300">Avatar</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`w-10 h-10 text-xl flex items-center justify-center rounded-lg transition-all ${
                      avatar === av 
                        ? 'bg-amber-500/20 ring-2 ring-amber-500' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleJoin}
              disabled={!name.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Rejoindre
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading state
  if (isConnecting || (isConnected && hasJoined && !isInRoom)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-zinc-400">Connexion en cours...</p>
        </div>
      </div>
    )
  }

  // Connection error
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">
            {error || 'Impossible de se connecter au serveur'}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reessayer
          </Button>
        </div>
      </div>
    )
  }

  // Render appropriate view based on phase
  if (phase === 'playing' || phase === 'finished') {
    return <MultiplayerGame />
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Lobby roomId={roomId} />
    </div>
  )
}
