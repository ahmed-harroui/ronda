'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/lib/card-engine'

interface CardProps {
  card: CardType
  faceDown?: boolean
  selected?: boolean
  highlighted?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-16 h-24',
  md: 'w-20 h-30',
  lg: 'w-24 h-36',
}

export function Card({
  card,
  faceDown = false,
  selected = false,
  highlighted = false,
  disabled = false,
  onClick,
  className,
  size = 'md',
}: CardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div
      className={cn(
        'relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
        sizeClasses[size],
        selected && 'ring-2 ring-amber-400 -translate-y-2',
        highlighted && 'ring-2 ring-emerald-400 animate-pulse',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      layout
    >
      {faceDown || imageError ? (
        <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center">
          <div className="w-3/4 h-3/4 border-2 border-amber-400/50 rounded-md flex items-center justify-center">
            <div className="text-amber-400/70 text-2xl font-bold">R</div>
          </div>
        </div>
      ) : (
        <Image
          src={card.image}
          alt={card.label}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
      
      {/* Selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-amber-400/20 pointer-events-none" />
      )}
      
      {/* Highlight overlay */}
      {highlighted && (
        <div className="absolute inset-0 bg-emerald-400/20 pointer-events-none" />
      )}
    </motion.div>
  )
}
