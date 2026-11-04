import {
  CalendarDays,
  CheckCircle2,
  History,
  Trophy,
} from 'lucide-react'
import type {
  HouseholdMember,
  HouseholdState,
} from '../../types/household'
import { getChoreDueInfo } from '../dashboard/TodayChoresList'

interface WeekDashboardProps {
  state: HouseholdState
  members: HouseholdMember[]
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

export function WeekDashboard({
  state,
  members,
  onCompleteChore,
}: WeekDashboardProps) {
  const memberA = members[0]
  const memberB = members[1]

  // Berechne Erledigungen & XP dieser Woche pro Person
  const getMemberStats = (memberId: string) => {
    const logs = state.activityLog.filter((log) => log.completedBy === memberId)
    const totalXP = logs.reduce((sum, item) => sum + item.xpPoints, 0)
    const assignedChores = state.chores.filter(
      (c) => c.assignedTo === memberId
    )
    return {
      completedCount: logs.length,
      totalXP,
      assignedChoresCount: assignedChores.length,
    }
  }

  const statsA = getMemberStats(memberA?.id || 'member-a')
  const statsB = getMemberStats(memberB?.id || 'member-b')

  const totalCompleted = state.activityLog.length

  return (
    <div className="space-y-4">
      {/* 1. Header Banner mit Comic Trophäe */}
      <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-[#2c170d] p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-comic text-xs uppercase tracking-wider text-amber-400">
              ★ WOCHEN-DASHBOARD &amp; SCOREBOARD ★
            </span>
            <h2 className="font-comic text-2xl uppercase tracking-wide text-white">
              Wer hat was gerockt?
            </h2>
            <p className="text-xs font-medium text-amber-100/70">
              Transparenz &amp; Fairness auf einen Blick
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <Trophy className="h-7 w-7 stroke-[2.5]" />
          </div>
        </div>

        {/* Head-to-Head Scoreboard */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Person A */}
          <div className="rounded-2xl border-2 border-black bg-[#180e07] p-3 comic-shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{memberA?.avatar}</span>
              <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.5 font-comic text-xs font-bold text-black">
                {statsA.totalXP} XP
              </span>
            </div>
            <div className="mt-1 font-comic text-lg uppercase text-white">
              {memberA?.name}
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-amber-100/70">
              <div className="flex justify-between">
                <span>Erledigt:</span>
                <strong className="text-amber-300 font-comic text-sm">
                  {statsA.completedCount}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Offen:</span>
                <span className="text-white font-medium">
                  {statsA.assignedChoresCount} Tasks
                </span>
              </div>
            </div>
          </div>

          {/* Person B */}
          <div className="rounded-2xl border-2 border-black bg-[#180e07] p-3 comic-shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{memberB?.avatar}</span>
              <span className="rounded-md border border-black bg-rose-500 px-1.5 py-0.5 font-comic text-xs font-bold text-white">
                {statsB.totalXP} XP
              </span>
            </div>
            <div className="mt-1 font-comic text-lg uppercase text-white">
              {memberB?.name}
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-amber-100/70">
              <div className="flex justify-between">
                <span>Erledigt:</span>
                <strong className="text-rose-400 font-comic text-sm">
                  {statsB.completedCount}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Offen:</span>
                <span className="text-white font-medium">
                  {statsB.assignedChoresCount} Tasks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fairness Bar */}
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] font-comic uppercase text-amber-200/80">
            <span>{memberA?.name} ({statsA.completedCount})</span>
            <span>Fairness-Balance</span>
            <span>{memberB?.name} ({statsB.completedCount})</span>
          </div>
          <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full border border-black bg-[#150a04]">
            <div
              className="bg-amber-400 transition-all duration-300"
              style={{
                width: `${
                  totalCompleted === 0
                    ? 50
                    : Math.round((statsA.completedCount / totalCompleted) * 100)
                }%`,
              }}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{
                width: `${
                  totalCompleted === 0
                    ? 50
                    : Math.round((statsB.completedCount / totalCompleted) * 100)
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Alle Tasks der Woche (Geordnet nach Fälligkeit) */}
      <section className="rounded-3xl border-3 border-black bg-[#23140a] p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-400 stroke-[2.5]" />
            <h3 className="font-comic text-xl uppercase tracking-wide text-white">
              Wochen-Aufgaben ({state.chores.length})
            </h3>
          </div>
          <span className="rounded-xl border border-black bg-black/60 px-2.5 py-1 font-comic text-xs uppercase text-amber-300">
            A/B Rotation
          </span>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {state.chores.map((chore) => {
            const due = getChoreDueInfo(chore)
            const assignee = members.find((m) => m.id === chore.assignedTo)

            return (
              <div
                key={chore.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-black bg-[#160b06] p-3 comic-shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-comic text-base text-white">
                      {chore.title}
                    </span>
                    <span
                      className={`rounded-md border border-black px-1.5 py-0.2 font-comic text-[11px] uppercase ${
                        due.daysRemaining <= 0
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/80 text-amber-300'
                      }`}
                    >
                      {due.statusText}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-amber-100/70">
                    {assignee && (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-200">
                        <span>{assignee.avatar}</span>
                        <span>{assignee.name}</span>
                      </span>
                    )}
                    <span>· alle {chore.intervalDays} Tage</span>
                    <span>· ~{chore.estimatedMinutes}m</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCompleteChore(chore.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300 active:translate-y-0.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Abhaken</span>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Live-Aktivitäts-Log (Wer hat was gemacht) */}
      <section className="rounded-3xl border-3 border-black bg-[#23140a] p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-400 stroke-[2.5]" />
            <h3 className="font-comic text-xl uppercase tracking-wide text-white">
              Erledigt-Protokoll ({state.activityLog.length})
            </h3>
          </div>
          <span className="font-comic text-xs uppercase text-amber-200/60">
            Neueste zuerst
          </span>
        </div>

        <div className="mt-3.5 space-y-2">
          {state.activityLog.length === 0 ? (
            <div className="rounded-2xl border border-black/40 bg-black/20 p-4 text-center text-xs text-amber-200/50">
              Noch keine Aktivitäten protokolliert. Hake eine Aufgabe ab!
            </div>
          ) : (
            state.activityLog.map((log) => {
              const categoryColor: Record<string, string> = {
                chore: 'bg-amber-400 text-black',
                dishwasher: 'bg-sky-400 text-black',
                laundry: 'bg-emerald-400 text-black',
                waste: 'bg-rose-500 text-white',
              }

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black bg-[#160b06] px-3.5 py-2.5 comic-shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{log.completedByAvatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-comic text-sm font-bold text-white">
                          {log.title}
                        </span>
                        <span
                          className={`rounded-md border border-black px-1.5 py-0.2 font-comic text-[10px] uppercase ${
                            categoryColor[log.category] || 'bg-white text-black'
                          }`}
                        >
                          +{log.xpPoints} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/70">
                        Erledigt von <strong>{log.completedByName}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 font-comic text-xs text-amber-200/60">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
