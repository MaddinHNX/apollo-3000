import { useState } from 'react'
import {
  ArrowRightLeft,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { GoogleCalendarService } from '../../services/googleCalendar'
import type { HouseholdMember, StandardChore } from '../../types/household'

interface TodayChoresListProps {
  chores: StandardChore[]
  members: HouseholdMember[]
  onCompleteChore: (choreId: string) => void
}

export function getChoreDueInfo(chore: StandardChore): {
  daysRemaining: number
  isDueOrOverdue: boolean
  statusText: string
} {
  const last = new Date(chore.lastCompletedAt)
  last.setHours(0, 0, 0, 0)
  const nextDue = new Date(last)
  nextDue.setDate(nextDue.getDate() + chore.intervalDays)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysRemaining = Math.round(
    (nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      isDueOrOverdue: true,
      statusText: `${Math.abs(daysRemaining)} Tg. ÜBERFÄLLIG!`,
    }
  }
  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      isDueOrOverdue: true,
      statusText: 'HEUTE FÄLLIG!',
    }
  }
  return {
    daysRemaining,
    isDueOrOverdue: false,
    statusText: `in ${daysRemaining} Tg.`,
  }
}

export function TodayChoresList({
  chores,
  members,
  onCompleteChore,
}: TodayChoresListProps) {
  const [swipedChoreId, setSwipedChoreId] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const sortedChores = [...chores].sort((a, b) => {
    return getChoreDueInfo(a).daysRemaining - getChoreDueInfo(b).daysRemaining
  })

  const handleOpenGoogleCalendar = (chore: StandardChore) => {
    const assignee = members.find((m) => m.id === chore.assignedTo)
    const assigneeName = assignee ? assignee.name : 'Haushalt'
    const intentUrl = GoogleCalendarService.createWebIntentUrl(chore, assigneeName)
    window.open(intentUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      aria-label="Heutige Aufgaben"
      className="rounded-3xl border-3 border-black bg-[#22150d] p-4 comic-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-comic text-2xl uppercase tracking-wide text-amber-300">
            Putzplan & Rotation
          </h2>
          <p className="text-xs font-medium text-amber-100/70">
            Antippen / Wischen zum Erledigen (wechselt A ↔ B)
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-amber-400 px-2.5 py-1 font-comic text-xs uppercase text-black comic-shadow-sm">
          <ArrowRightLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          A/B AUTO
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {sortedChores.map((chore) => {
          const due = getChoreDueInfo(chore)
          const assignee = members.find((m) => m.id === chore.assignedTo)
          const nextAssigneeId =
            chore.rotationOrder[0] === chore.assignedTo
              ? chore.rotationOrder[1]
              : chore.rotationOrder[0]
          const nextAssignee = members.find((m) => m.id === nextAssigneeId)
          const isCompleting = swipedChoreId === chore.id

          return (
            <div
              key={chore.id}
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchStartX === null) return
                const deltaX = e.changedTouches[0].clientX - touchStartX
                if (deltaX > 65) {
                  setSwipedChoreId(chore.id)
                  setTimeout(() => {
                    onCompleteChore(chore.id)
                    setSwipedChoreId(null)
                  }, 250)
                }
                setTouchStartX(null)
              }}
              className={`group relative overflow-hidden rounded-2xl border-3 border-black p-3.5 transition-all duration-200 comic-shadow-sm ${
                isCompleting
                  ? 'translate-x-4 border-emerald-500 bg-emerald-950/70 opacity-60'
                  : due.isDueOrOverdue
                    ? 'bg-[#2f110c]'
                    : 'bg-[#180e08]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Radio / Check Button mit Vintage Comic Look */}
                <button
                  type="button"
                  aria-label={`${chore.title} als erledigt markieren`}
                  onClick={() => {
                    setSwipedChoreId(chore.id)
                    setTimeout(() => {
                      onCompleteChore(chore.id)
                      setSwipedChoreId(null)
                    }, 220)
                  }}
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-200 transition hover:text-emerald-400 active:scale-90"
                >
                  {isCompleting ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  ) : (
                    <Circle
                      className={`h-7 w-7 stroke-[2.5] ${
                        due.isDueOrOverdue ? 'text-rose-400' : 'text-amber-200/50'
                      }`}
                    />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-comic text-lg uppercase tracking-wide text-white">
                        {chore.title}
                      </h3>
                      <span
                        className={`rounded-md border border-black px-1.5 py-0.5 font-comic text-xs uppercase ${
                          due.daysRemaining < 0
                            ? 'bg-rose-500 text-white'
                            : due.daysRemaining === 0
                              ? 'bg-amber-400 text-black'
                              : 'bg-black/50 text-amber-200/70'
                        }`}
                      >
                        {due.statusText}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Als Google Kalender Termin anlegen"
                      onClick={() => handleOpenGoogleCalendar(chore)}
                      className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-amber-400/90 px-2.5 py-1 font-comic text-xs uppercase text-black comic-shadow-sm transition hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <CalendarPlus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>In Kalender</span>
                    </button>
                  </div>

                  {chore.description && (
                    <p className="mt-1 text-xs text-amber-100/70">
                      {chore.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      {assignee && (
                        <span className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-white px-2 py-0.5 text-black comic-shadow-sm">
                          <span>{assignee.avatar}</span>
                          <span className="font-comic text-xs">{assignee.name}</span>
                        </span>
                      )}
                      {nextAssignee && (
                        <span className="text-[11px] font-medium text-amber-200/60">
                          danach {nextAssignee.avatar} {nextAssignee.name}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-300/80">
                      <Clock className="h-3 w-3" />~{chore.estimatedMinutes} Min. · alle{' '}
                      {chore.intervalDays} Tg.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300/60">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <span>Erledigen rotiert die Aufgabe sofort zum Partner!</span>
      </div>
    </section>
  )
}
