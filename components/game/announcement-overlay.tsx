'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Announcement } from '@/lib/card-engine'
import { Trophy, Sparkles, Target } from 'lucide-react'

interface AnnouncementOverlayProps {
  announcements: Announcement[]
  players: { id: string; name: string }[]
}

const announcementConfig = {
  ronda: {
    icon: Sparkles,
    label: 'RONDA!',
    color: 'from-amber-500 to-yellow-500',
    textColor: 'text-amber-100',
  },
  tringa: {
    icon: Trophy,
    label: 'TRINGA!',
    color: 'from-red-500 to-orange-500',
    textColor: 'text-red-100',
  },
  missa: {
    icon: Target,
    label: 'MISSA!',
    color: 'from-emerald-500 to-teal-500',
    textColor: 'text-emerald-100',
  },
}

export function AnnouncementOverlay({ announcements, players }: AnnouncementOverlayProps) {
  // Show only the last announcement
  const latestAnnouncement = announcements[announcements.length - 1]
  
  if (!latestAnnouncement) return null
  
  const config = announcementConfig[latestAnnouncement.type]
  const player = players.find(p => p.id === latestAnnouncement.playerId)
  const Icon = config.icon
  
  return (
    <AnimatePresence>
      <motion.div
        key={latestAnnouncement.playerId + latestAnnouncement.type}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <motion.div
          className={`bg-gradient-to-br ${config.color} p-8 rounded-3xl shadow-2xl`}
          initial={{ rotate: -10, y: 50 }}
          animate={{ 
            rotate: [0, -5, 5, 0],
            y: 0,
          }}
          transition={{
            rotate: { repeat: 2, duration: 0.3 },
            y: { type: 'spring', stiffness: 200 },
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Icon className={`w-16 h-16 ${config.textColor}`} />
            <div className={`text-4xl font-bold ${config.textColor}`}>
              {config.label}
            </div>
            <div className={`text-xl ${config.textColor}/80`}>
              {player?.name}
            </div>
            <div className={`text-lg ${config.textColor}/60`}>
              +{latestAnnouncement.points} points
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
