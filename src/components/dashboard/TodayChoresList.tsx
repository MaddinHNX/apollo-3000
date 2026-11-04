import { useState } from 'react'
import {
  ArrowRightLeft,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
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
      statusText: `${Math.abs(daysRemaining)} Tg. überfällig`,
    }
  }
  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      isDueOrOverdue: true,
      statusText: 'Heute fällig',
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
      className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Aufgaben & Rotation
          </h2>
          <p className="text-xs text-slate-400">
            Antippen/Wischen zum Abhaken · 1-Tap Google Kalender Export
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
          <ArrowRightLeft className="h-3 w-3" />
          A/B Auto
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5">
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
              className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 ${
                isCompleting
                  ? 'translate-x-4 border-emerald-500/50 bg-emerald-950/30 opacity-60'
                  : due.isDueOrOverdue
                    ? 'border-rose-500/35 bg-slate-950/90'
                    : 'border-slate-800/80 bg-slate-950/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Radio / Check Button */}
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
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-emerald-400 active:scale-90"
                >
                  {isCompleting ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Circle
                      className={`h-6 w-6 ${
                        due.isDueOrOverdue
                          ? 'text-rose-400'
                          : 'text-slate-600 group-hover:text-indigo-400'
                      }`}
                    />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">
                        {chore.title}
                      </h3>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          due.daysRemaining < 0
                            ? 'bg-rose-500/20 text-rose-300'
                            : due.daysRemaining === 0
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {due.statusText}
                      </span>
                    </div>

                    {/* Google Calendar Direct Export Button */}
                    <button
                      type="button"
                      title="Als Google Kalender Termin anlegen"
                      onClick={() => handleOpenGoogleCalendar(chore)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-indigo-500/50 hover:bg-slate-700 hover:text-indigo-200 active:scale-95"
                    >
                      <CalendarPlus className="h-3 w-3 text-indigo-400" />
                      <span>In Kalender</span>
                      <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                    </button>
                  </div>

                  {chore.description && (
                    <p className="mt-1 text-xs text-slate-400">
                      {chore.description}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {assignee && (
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium text-slate-100"
                          style={{
                            backgroundColor: `${assignee.color}25`,
                            border: `1px solid ${assignee.color}55`,
                          }}
                        >
                          <span>{assignee.avatar}</span>
                          <span>{assignee.name}</span>
                        </span>
                      )}
                      {nextAssignee && (
                        <span className="text-slate-500">
                          danach {nextAssignee.avatar} {nextAssignee.name}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-slate-500">
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

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
        <span>Tipp: &quot;In Kalender&quot; öffnet direkt die Google Kalender Vorlage</span>
      </div>
    </section>
  )
}
