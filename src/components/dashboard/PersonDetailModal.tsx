import {
  CalendarDays,
  CheckCircle2,
  History,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import type {
  HouseholdMember,
  HouseholdState,
} from '../../types/household'
import { getChoreDueInfo } from '../dashboard/TodayChoresList'

interface PersonDetailModalProps {
  isOpen: boolean
  onClose: () => void
  member: HouseholdMember
  state: HouseholdState
  onCompleteChore: (choreId: string) => void
}

function formatRelativeTime(isoString: string): string {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000)
  )
  if (diffMinutes < 60) return `vor ${diffMinutes}m`
  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  return `vor ${days}d`
}

export function PersonDetailModal({
  isOpen,
  onClose,
  member,
  state,
  onCompleteChore,
}: PersonDetailModalProps) {
  if (!isOpen) return null

  // Offene Aufgaben für diese Person
  const assignedChores = state.chores.filter(
    (c) => c.assignedTo === member.id
  )

  // Aktive Wäsche für diese Person
  const assignedLaundry = state.laundry.filter(
    (l) => l.assignedTo === member.id && l.stage !== 'idle' && l.stage !== 'done'
  )

  // Erledigte Aktivitäten dieser Person
  const memberLogs = state.activityLog.filter(
    (log) => log.completedBy === member.id
  )
  const totalXP = memberLogs.reduce((sum, item) => sum + item.xpPoints, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border-3 border-black bg-white p-5 text-slate-900 comic-shadow">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border-2 border-black bg-rose-500 p-1 text-white comic-shadow-sm hover:bg-rose-600"
        >
          <X className="h-4 w-4 stroke-[3]" />
        </button>

        {/* Member Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-3xl comic-shadow-sm">
            {member.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900">
                {member.name}
              </h2>
              <span className="rounded-md border border-black bg-amber-200 px-2 py-0.5 font-comic text-xs text-black font-bold">
                {member.roleLabel || 'Haushaltsmitglied'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-comic text-sm font-bold text-amber-600">
                <Trophy className="h-3.5 w-3.5 stroke-[2.5]" />
                {totalXP} XP gesammelt
              </span>
              <span>· {memberLogs.length} Erledigungen</span>
            </div>
          </div>
        </div>

        {/* 1. Was steht diese Woche an? (Offene Aufgaben) */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5">
            <span className="flex items-center gap-1.5 font-comic text-sm uppercase tracking-wide text-amber-700 font-bold">
              <CalendarDays className="h-4 w-4 stroke-[2.5]" />
              Steht diese Woche an ({assignedChores.length}):
            </span>
          </div>

          {assignedChores.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500 font-medium">
              🎉 Alles erledigt! Aktuell keine offenen Aufgaben für {member.name}.
            </div>
          ) : (
            assignedChores.map((chore) => {
              const due = getChoreDueInfo(chore)
              return (
                <div
                  key={chore.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border-2 border-black bg-amber-50/70 p-3 comic-shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-comic text-base text-slate-900 font-bold">
                        {chore.title}
                      </span>
                      <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.2 font-comic text-xs font-bold text-black">
                        +{chore.xpReward || 30} XP
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                      <span
                        className={`font-semibold ${
                          due.daysRemaining <= 0
                            ? 'text-rose-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {due.statusText}
                      </span>
                      <span>· ~{chore.estimatedMinutes}m</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onCompleteChore(chore.id)
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-2.5 py-1.5 font-comic text-xs uppercase text-black font-bold comic-shadow-sm hover:bg-emerald-300 active:translate-y-0.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Erledigt!</span>
                  </button>
                </div>
              )
            })
          )}

          {/* Aktive Wäsche-Sorten für dieses Mitglied */}
          {assignedLaundry.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <span className="font-comic text-xs uppercase text-slate-700 font-bold">
                Laufende Wäsche:
              </span>
              {assignedLaundry.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border-2 border-black bg-sky-50 px-3 py-1.5 text-xs text-slate-800"
                >
                  <span className="font-medium">{l.label} ({l.temperature})</span>
                  <span className="font-comic text-sky-800 uppercase font-bold">
                    Stage: {l.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Was wurde schon erledigt? (Historie) */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5">
            <span className="flex items-center gap-1.5 font-comic text-sm uppercase tracking-wide text-slate-800 font-bold">
              <History className="h-4 w-4 stroke-[2.5]" />
              Schon erledigt ({memberLogs.length}):
            </span>
          </div>

          {memberLogs.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500 font-medium">
              Noch keine Aktivitäten in dieser Woche erfasst.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {memberLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border-2 border-black bg-white px-3 py-2 text-xs comic-shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-comic text-sm text-slate-900 font-bold">
                      {log.title}
                    </span>
                    <span className="rounded border border-black bg-emerald-400 px-1 font-comic text-[10px] text-black font-bold">
                      +{log.xpPoints} XP
                    </span>
                  </div>
                  <span className="font-comic text-[11px] text-slate-500">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate-500">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Tipp: Erledigte Aufgaben rotieren sofort zum Partner</span>
        </div>
      </div>
    </div>
  )
}
