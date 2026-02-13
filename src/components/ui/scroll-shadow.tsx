import { useEffect, useRef, useState, type ReactNode } from 'react'

export function ScrollShadow({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      setShowTop(el.scrollTop > 2)
      setShowBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 2)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative flex-1 min-h-0">
      {/* Top shadow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-card/90 to-transparent transition-opacity duration-200"
        style={{ opacity: showTop ? 1 : 0 }}
      />

      <div
        ref={scrollRef}
        className="sidebar-scroll h-full overflow-y-auto scroll-smooth"
      >
        {children}
      </div>

      {/* Bottom shadow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-card/90 to-transparent transition-opacity duration-200"
        style={{ opacity: showBottom ? 1 : 0 }}
      />
    </div>
  )
}
