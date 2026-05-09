import { redirect } from 'next/navigation'

interface JoinPageProps {
  params: Promise<{ roomId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { roomId } = await params
  
  // Redirect to the room page
  redirect(`/room/${roomId}`)
}

export function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  return params.then(({ roomId }) => ({
    title: `Rejoindre ${roomId} - Ronda`,
    description: 'Rejoignez cette partie de Ronda en ligne',
  }))
}
