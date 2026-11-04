import { BellRing, Check, Clock, Trash2 } from 'lucide-react'
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

  // Items picked up tomorrow (with evening-before reminder) or today
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
      className={`rounded-3xl border p-4 transition-all ${
        isEveningWindow
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 shadow-lg shadow-amber-950/20'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isEveningWindow
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isEveningWindow ? (
              <BellRing className="h-4 w-4 animate-bounce" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {isEveningWindow
                  ? 'Vorabend-Alarm (18:00+)'
                  : 'Morgen Abholung'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              {isEveningWindow
                ? 'Jetzt rausstellen für die morgige Abfuhr!'
                : 'Erinnerung ab 18:00 Uhr aktiv'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSimulateEvening}
          title="18:00+ Vorabend-Modus testen"
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-medium transition ${
            simulateEveningAlert
              ? 'border-amber-500/40 bg-amber-500/20 text-amber-200'
              : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-3 w-3" />
          <span>18:00 {simulateEveningAlert ? 'An' : 'Test'}</span>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {urgentItems.map((item) => {
          const days = getDaysUntil(item.nextPickupDate)
          const assignee = members.find((m) => m.id === item.assignedTo)

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/70 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-slate-900"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {item.label}
                    </span>
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      {days === 0 ? 'Heute' : 'Morgen früh'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {item.notes}
                    {assignee ? ` · ${assignee.avatar} ${assignee.name}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onMarkPutOut(item.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition hover:bg-emerald-500/30 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Steht draußen</span>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
