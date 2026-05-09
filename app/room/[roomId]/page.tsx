import { RoomClient } from '@/components/multiplayer'

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params
  
  return <RoomClient roomId={roomId} />
}

export function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  return params.then(({ roomId }) => ({
    title: `Partie ${roomId} - Ronda`,
    description: 'Rejoignez cette partie de Ronda en ligne',
  }))
}
