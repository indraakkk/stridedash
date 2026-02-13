import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/editor/$projectId', params: { projectId: 'new' } })
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to editor...</p>
    </div>
  )
}
