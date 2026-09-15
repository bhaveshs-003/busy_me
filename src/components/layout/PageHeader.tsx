import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  leftAction?: ReactNode
  rightActions?: ReactNode
  showBack?: boolean
}

export function PageHeader({
  title,
  subtitle,
  leftAction,
  rightActions,
  showBack = false,
}: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      {/* Left slot */}
      <div className="flex items-center gap-1 min-w-[40px]">
        {showBack && !leftAction && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg text-gray-600 active:opacity-60 transition-opacity"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {leftAction}
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0 text-center">
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Right slot */}
      <div className="flex items-center gap-1 min-w-[40px] justify-end">
        {rightActions}
      </div>
    </header>
  )
}

export default PageHeader
