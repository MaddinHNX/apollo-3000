import { CalendarCheck2, Home, Shirt, Trash2 } from 'lucide-react'
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
  { id: 'dashboard', label: 'Heute', icon: Home },
  { id: 'laundry', label: 'Wäsche', icon: Shirt },
  { id: 'waste', label: 'Müll', icon: Trash2 },
  { id: 'schedule', label: 'Wochenplan', icon: CalendarCheck2 },
]

export function BottomNav({ activeTab, onSelectTab, badges = {} }: BottomNavProps) {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl pb-safe"
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-2 pt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const badgeCount = badges[id] ?? 0

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div
                className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-indigo-500/15' : 'group-hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight ${
                  isActive ? 'font-semibold text-indigo-300' : 'font-medium'
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
