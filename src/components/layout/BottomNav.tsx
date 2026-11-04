import {
  CalendarCheck2,
  ChefHat,
  LayoutDashboard,
  Shirt,
  Trash2,
} from 'lucide-react'
import type { NavigationTab } from '../../types/household'

interface BottomNavProps {
  activeTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  badges?: Partial<Record<NavigationTab, number>>
}

const NAV_ITEMS: {
  id: NavigationTab
  label: string
  icon: typeof ChefHat
}[] = [
  { id: 'kitchen', label: 'KÜCHE', icon: ChefHat },
  { id: 'week', label: 'WOCHE', icon: LayoutDashboard },
  { id: 'laundry', label: 'WÄSCHE', icon: Shirt },
  { id: 'waste', label: 'MÜLL', icon: Trash2 },
  { id: 'schedule', label: 'PLAN', icon: CalendarCheck2 },
]

export function BottomNav({ activeTab, onSelectTab, badges = {} }: BottomNavProps) {
  const isHomeActive = activeTab === 'dashboard'

  return (
    <>
      {/* 1. Flexibler schwebender Putzeimer als Home-Button (Weiter nach oben gesetzt: bottom-28) */}
      <button
        type="button"
        title="Zurück zur Startseite (Heute)"
        onClick={() => onSelectTab('dashboard')}
        className={`fixed bottom-28 left-4 z-50 flex items-center gap-2 rounded-full border-3 border-black p-2.5 comic-shadow transition-all duration-200 active:scale-95 ${
          isHomeActive
            ? 'bg-amber-400 scale-105 ring-4 ring-amber-300/60'
            : 'bg-white hover:bg-amber-100 hover:scale-105'
        }`}
      >
        <div className="relative flex h-10 w-10 items-center justify-center text-2xl">
          {/* Putzeimer Emoji / Icon */}
          <span>🪣</span>
          {badges.dashboard ? (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-black bg-rose-500 px-1 font-comic text-xs font-bold text-white comic-shadow-sm">
              {badges.dashboard}
            </span>
          ) : null}
        </div>
        <span className="pr-1.5 font-comic text-xs font-bold uppercase tracking-wider text-slate-900">
          HEUTE
        </span>
      </button>

      {/* 2. Feste Bottom Navigation */}
      <nav
        aria-label="Hauptnavigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t-3 border-black bg-white/95 backdrop-blur-xl pb-safe shadow-lg"
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
                    ? 'text-black'
                    : 'text-slate-500 hover:text-black active:scale-95'
                }`}
              >
                <div
                  className={`relative flex h-8 w-11 items-center justify-center rounded-2xl transition-all ${
                    isActive
                      ? 'border-2 border-black bg-amber-400 text-black comic-shadow-sm -translate-y-0.5 font-bold'
                      : 'group-hover:bg-slate-100'
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
                    isActive ? 'text-black font-bold' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
