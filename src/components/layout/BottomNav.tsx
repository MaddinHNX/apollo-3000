import { CalendarCheck2, Home, LayoutDashboard, Shirt, Trash2 } from 'lucide-react'
import type { NavigationTab } from '../../types/household'

interface BottomNavProps {
  activeTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  badges?: Partial<Record<NavigationTab, number>>
}

const NAV_ITEMS: {
  id: NavigationTab
  label: string
  icon: typeof Home
}[] = [
  { id: 'dashboard', label: 'HEUTE', icon: Home },
  { id: 'week', label: 'WOCHE', icon: LayoutDashboard },
  { id: 'laundry', label: 'WÄSCHE', icon: Shirt },
  { id: 'waste', label: 'MÜLL', icon: Trash2 },
  { id: 'schedule', label: 'PLAN', icon: CalendarCheck2 },
]

export function BottomNav({ activeTab, onSelectTab, badges = {} }: BottomNavProps) {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t-3 border-black bg-[#1b1009]/95 backdrop-blur-xl pb-safe"
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-1 pt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const badgeCount = badges[id] ?? 0

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-150 ${
                isActive
                  ? 'text-amber-400'
                  : 'text-amber-200/50 hover:text-amber-100 active:scale-95'
              }`}
            >
              <div
                className={`relative flex h-8 w-11 items-center justify-center rounded-2xl transition-all ${
                  isActive
                    ? 'border-2 border-black bg-amber-400 text-black comic-shadow-sm -translate-y-0.5'
                    : 'group-hover:bg-black/30'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.8]' : 'stroke-[2]'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -right-1 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-rose-500 px-1 font-comic text-[10px] font-bold leading-none text-white comic-shadow-sm">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`font-comic text-[11px] uppercase tracking-wider ${
                  isActive ? 'text-amber-300 font-bold' : 'text-amber-200/50'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
