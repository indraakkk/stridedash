import { createFileRoute } from '@tanstack/react-router'
import { EditorLayout } from '~/components/editor/EditorLayout'

export const Route = createFileRoute('/editor/$projectId')({
  component: EditorPage,
})

function EditorPage() {
  const { projectId } = Route.useParams()
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-card px-4 shadow-sm">
        <h1 className="font-[family-name:var(--font-display)] text-lg tracking-wide text-foreground">
          Stridash
        </h1>
        <span className="ml-2 text-xs text-muted-foreground">
          {projectId !== 'new' ? projectId : ''}
        </span>
      </header>
      <div className="flex-1 overflow-hidden">
        <EditorLayout />
      </div>
    </div>
  )
}
