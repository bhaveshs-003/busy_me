import { NavLink } from 'react-router-dom'
import { MessageSquare, Layers, Calendar, User } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

const NAV_ITEMS = [
  { label: 'Chat', icon: MessageSquare, route: '/chat', showBadge: true },
  { label: 'Ongoings', icon: Layers, route: '/ongoings', showBadge: false },
  { label: 'Calendar', icon: Calendar, route: '/calendar', showBadge: false },
  { label: 'Profile', icon: User, route: '/profile', showBadge: false },
]

/**
 * Always visible. Sits as a flex child at the bottom of the phone frame rather
 * than `fixed` to the viewport — on a wide screen a fixed nav would span the
 * whole window instead of staying inside the frame.
 */
export function BottomNavigation() {
  const unreadCount = useUIStore((s) => s.unreadCount)

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-gray-100 safe-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ label, icon: Icon, route, showBadge }) => (
          <NavLink
            key={route}
            to={route}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 transition-opacity active:opacity-60 ${
                isActive ? 'text-brand-500' : 'text-gray-400'
              }`
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                  {showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-brand-500 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavigation
