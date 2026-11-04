import { BellRing, Check, Clock } from 'lucide-react'
import type { HouseholdMember, WasteScheduleItem } from '../../types/household'

interface WasteAlertBannerProps {
  wasteItems: WasteScheduleItem[]
  members: HouseholdMember[]
  currentHour: number
  simulateEveningAlert: boolean
  onToggleSimulateEvening: () => void
  onMarkPutOut: (wasteId: WasteScheduleItem['id']) => void
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function WasteAlertBanner({
  wasteItems,
  members,
  currentHour,
  simulateEveningAlert,
  onToggleSimulateEvening,
  onMarkPutOut,
}: WasteAlertBannerProps) {
  const isEveningWindow = currentHour >= 18 || simulateEveningAlert

  const urgentItems = wasteItems.filter((item) => {
    const days = getDaysUntil(item.nextPickupDate)
    if (days === 0) return true
    if (days === 1 && item.reminderEveningBefore) return true
    return false
  })

  if (urgentItems.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Müll-Erinnerung"
      className="relative overflow-hidden rounded-3xl border-3 border-black bg-[#2d1209] p-4 comic-shadow"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-3 border-black bg-rose-500 text-white comic-shadow-sm">
            <BellRing className="h-5 w-5 animate-bounce stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-comic text-base tracking-wide text-amber-300 uppercase">
                {isEveningWindow
                  ? '⚡ VORABEND-ALARM (18:00+) ⚡'
                  : 'MORGEN ABHOLUNG!'}
              </h3>
            </div>
            <p className="text-xs font-medium text-amber-100/80">
              {isEveningWindow
                ? 'Jetzt an die Straße stellen!'
                : 'Erinnerung am Vorabend aktiv'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSimulateEvening}
          className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-[#1f0d06] px-2.5 py-1 font-comic text-xs uppercase text-amber-300 transition hover:bg-black active:translate-y-0.5"
        >
          <Clock className="h-3 w-3" />
          <span>18:00 {simulateEveningAlert ? 'An' : 'Test'}</span>
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {urgentItems.map((item) => {
          const days = getDaysUntil(item.nextPickupDate)
          const assignee = members.find((m) => m.id === item.assignedTo)

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-2xl border-2 border-black bg-[#1a0a04] p-3 comic-shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border-2 border-black"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-comic text-lg text-white">
                      {item.label}
                    </span>
                    <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.5 font-comic text-xs text-black">
                      {days === 0 ? 'HEUTE' : 'MORGEN FRÜH'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/70">
                    {item.notes}
                    {assignee ? ` · ${assignee.avatar} ${assignee.name}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onMarkPutOut(item.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase tracking-wider text-black comic-shadow-sm transition hover:bg-emerald-300 active:translate-x-0.5 active:translate-y-0.5"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Steht draußen!</span>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
