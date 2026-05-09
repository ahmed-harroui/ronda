'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  useRoomState, 
  useRoomActions, 
  usePlayerInfo,
  useCanStartGame,
  useIsHost,
  useMultiplayerStore,
  AVATARS 
} from '@/lib/multiplayer'
import { Check, Crown, Copy, Users, Settings2, X, Loader2 } from 'lucide-react'

interface LobbyProps {
  roomId: string
}

export function Lobby({ roomId }: LobbyProps) {
  const { players, settings, phase } = useRoomState()
  const { setReady, startGame, updateSettings, kickPlayer, leaveRoom } = useRoomActions()
  const { playerName, playerAvatar, playerId } = usePlayerInfo()
  const canStart = useCanStartGame()
  const isHost = useIsHost()
  const connectionStatus = useMultiplayerStore(state => state.connectionStatus)
  const error = useMultiplayerStore(state => state.error)
  
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${roomId}` 
    : ''

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myPlayer = players.find(p => p.id === playerId)
  const isReady = myPlayer?.status === 'ready'

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-zinc-400">Connexion en cours...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Salon de jeu</h1>
          <p className="text-zinc-400 text-sm">Code: {roomId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={leaveRoom}>
          Quitter
        </Button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Invite Link */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <Label className="text-zinc-300 mb-2 block">Lien d&apos;invitation</Label>
        <div className="flex gap-2">
          <Input 
            value={inviteLink} 
            readOnly 
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
          <Button 
            onClick={copyInviteLink}
            variant="outline"
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Players */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-300 font-medium">
              Joueurs ({players.length}/{settings?.maxPlayers || 2})
            </span>
          </div>
          {isHost && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{player.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-100 font-medium">{player.name}</span>
                    {player.isHost && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <span className={`text-xs ${
                    player.status === 'ready' ? 'text-green-500' :
                    player.status === 'connected' ? 'text-zinc-400' :
                    'text-red-500'
                  }`}>
                    {player.status === 'ready' ? 'Pret' :
                     player.status === 'connected' ? 'En attente' :
                     'Deconnecte'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {player.status === 'ready' && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
                {isHost && player.id !== playerId && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => kickPlayer(player.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Empty slots */}
          {settings && Array.from({ length: settings.maxPlayers - players.length }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="flex items-center justify-center bg-zinc-900/30 rounded-lg p-3 border-2 border-dashed border-zinc-700"
            >
              <span className="text-zinc-500 text-sm">En attente d&apos;un joueur...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings (host only) */}
      {showSettings && isHost && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
        >
          <h3 className="text-zinc-300 font-medium mb-4">Parametres</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 text-sm">Nombre de joueurs</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={settings?.maxPlayers === 2 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings({ maxPlayers: 2 })}
                >
                  2 joueurs
                </Button>
                <Button
                  variant={settings?.maxPlayers === 4 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings({ maxPlayers: 4 })}
                >
                  4 joueurs
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-zinc-400 text-sm">Score cible</Label>
              <div className="flex gap-2 mt-2">
                {[11, 21, 31].map(score => (
                  <Button
                    key={score}
                    variant={settings?.targetScore === score ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ targetScore: score })}
                  >
                    {score} points
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isHost && (
          <Button
            onClick={() => setReady(!isReady)}
            variant={isReady ? 'outline' : 'default'}
            className="flex-1"
          >
            {isReady ? 'Annuler' : 'Pret'}
          </Button>
        )}
        
        {isHost && (
          <Button
            onClick={startGame}
            disabled={!canStart}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            Lancer la partie
          </Button>
        )}
      </div>
      
      {isHost && !canStart && (
        <p className="text-zinc-500 text-sm text-center">
          En attente que les joueurs soient prets...
        </p>
      )}
    </div>
  )
}
