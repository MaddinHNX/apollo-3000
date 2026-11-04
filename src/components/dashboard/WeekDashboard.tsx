import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Download,
  History,
  Medal,
  Settings2,
  Trophy,
} from 'lucide-react'
import { GoogleCalendarService } from '../../services/googleCalendar'
import type {
  HouseholdMember,
  HouseholdState,
} from '../../types/household'
import { getChoreDueInfo } from '../dashboard/TodayChoresList'

interface WeekDashboardProps {
  state: HouseholdState
  members: HouseholdMember[]
  onCompleteChore: (choreId: string) => void
  onOpenSettings: () => void
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
  onOpenSettings,
}: WeekDashboardProps) {
  const memberA = members[0]
  const memberB = members[1]

  // Filtere Logs der aktuellen Woche (letzte 7 Tage)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  const getMemberStats = (memberId: string) => {
    const allLogs = state.activityLog.filter((log) => log.completedBy === memberId)
    const weekLogs = allLogs.filter(
      (log) => new Date(log.timestamp).getTime() >= oneWeekAgo
    )

    const totalXP = allLogs.reduce((sum, item) => sum + item.xpPoints, 0)
    const weekXP = weekLogs.reduce((sum, item) => sum + item.xpPoints, 0)
    const assignedChores = state.chores.filter(
      (c) => c.assignedTo === memberId
    )

    return {
      allCompletedCount: allLogs.length,
      weekCompletedCount: weekLogs.length,
      totalXP,
      weekXP,
      assignedChoresCount: assignedChores.length,
    }
  }

  const statsA = getMemberStats(memberA?.id || 'member-a')
  const statsB = getMemberStats(memberB?.id || 'member-b')
  const totalCompletedWeek = statsA.weekCompletedCount + statsB.weekCompletedCount

  // Wöchentlicher Sieger Ermittlung
  const hasWinner = statsA.weekXP !== statsB.weekXP
  const winnerMember = statsA.weekXP > statsB.weekXP ? memberA : memberB
  const winnerStats = statsA.weekXP > statsB.weekXP ? statsA : statsB

  // Rangliste nach Gesamten Punkten
  const leaderboard = [
    { member: memberA, stats: statsA },
    { member: memberB, stats: statsB },
  ].sort((a, b) => b.stats.totalXP - a.stats.totalXP)

  return (
    <div className="space-y-4">
      {/* 1. Header & Wöchentlicher Sieger Banner */}
      <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-comic text-xs uppercase tracking-wider text-amber-700">
              ★ WOCHEN-DASHBOARD &amp; SCOREBOARD ★
            </span>
            <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900 leading-tight">
              Wer hat was geputzt?
            </h2>
            <p className="text-xs font-medium text-slate-600">
              Transparenz &amp; Fairness auf einen Blick
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <Trophy className="h-7 w-7 stroke-[2.5]" />
          </div>
        </div>

        {/* Wöchentlicher Sieger Box */}
        <div className="mt-3.5 rounded-2xl border-2 border-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 p-3 comic-shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black bg-amber-400 text-black font-bold">
                <Crown className="h-5 w-5 fill-amber-500 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-comic text-[11px] uppercase tracking-wider text-amber-900">
                  Wöchentlicher Sieger
                </span>
                <div className="font-comic text-lg uppercase text-slate-900 leading-none">
                  {hasWinner ? (
                    <span>
                      {winnerMember?.avatar} {winnerMember?.name} liegt vorne!
                    </span>
                  ) : (
                    <span>Gleichstand – Kopf an Kopf!</span>
                  )}
                </div>
              </div>
            </div>
            {hasWinner && (
              <span className="rounded-xl border border-black bg-black px-2 py-1 font-comic text-xs font-bold text-amber-300">
                +{winnerStats.weekXP} XP diese Woche
              </span>
            )}
          </div>
        </div>

        {/* Head-to-Head Cards (Diese Woche) */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Person A */}
          <div className="rounded-2xl border-2 border-black bg-amber-50 p-3 comic-shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{memberA?.avatar}</span>
              <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.5 font-comic text-xs font-bold text-black">
                {statsA.weekXP} XP (Woche)
              </span>
            </div>
            <div className="mt-1 font-comic text-lg uppercase text-slate-900">
              {memberA?.name}
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Geputzt (Woche):</span>
                <strong className="text-amber-800 font-comic text-sm">
                  {statsA.weekCompletedCount}x
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Offen:</span>
                <span className="text-slate-900 font-medium">
                  {statsA.assignedChoresCount} Tasks
                </span>
              </div>
            </div>
          </div>

          {/* Person B */}
          <div className="rounded-2xl border-2 border-black bg-rose-50 p-3 comic-shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{memberB?.avatar}</span>
              <span className="rounded-md border border-black bg-rose-500 px-1.5 py-0.5 font-comic text-xs font-bold text-white">
                {statsB.weekXP} XP (Woche)
              </span>
            </div>
            <div className="mt-1 font-comic text-lg uppercase text-slate-900">
              {memberB?.name}
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Geputzt (Woche):</span>
                <strong className="text-rose-600 font-comic text-sm">
                  {statsB.weekCompletedCount}x
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Offen:</span>
                <span className="text-slate-900 font-medium">
                  {statsB.assignedChoresCount} Tasks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fairness Bar */}
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] font-comic uppercase text-slate-700">
            <span>{memberA?.name} ({statsA.weekCompletedCount})</span>
            <span>Wochen-Verhältnis</span>
            <span>{memberB?.name} ({statsB.weekCompletedCount})</span>
          </div>
          <div className="mt-1 flex h-3.5 w-full overflow-hidden rounded-full border-2 border-black bg-slate-100">
            <div
              className="bg-amber-400 transition-all duration-300"
              style={{
                width: `${
                  totalCompletedWeek === 0
                    ? 50
                    : Math.round((statsA.weekCompletedCount / totalCompletedWeek) * 100)
                }%`,
              }}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{
                width: `${
                  totalCompletedWeek === 0
                    ? 50
                    : Math.round((statsB.weekCompletedCount / totalCompletedWeek) * 100)
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Gesamte Rangliste (Allzeit-Punkte) */}
      <section className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-600 stroke-[2.5]" />
            <h3 className="font-comic text-xl uppercase tracking-wide text-slate-900">
              Gesamt-Rangliste (Allzeit)
            </h3>
          </div>
          <span className="font-comic text-xs uppercase text-slate-500">
            Gesamt-XP
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {leaderboard.map((item, index) => {
            const isFirst = index === 0
            return (
              <div
                key={item.member?.id || index}
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 border-black p-3 comic-shadow-sm ${
                  isFirst ? 'bg-amber-100/80' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border border-black font-comic text-sm font-bold ${
                      isFirst ? 'bg-amber-400 text-black' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <span className="text-2xl">{item.member?.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5 font-comic text-base text-slate-900">
                      <span>{item.member?.name}</span>
                      {isFirst && <Crown className="h-4 w-4 fill-amber-500 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {item.stats.allCompletedCount} Aktionen insgesamt erledigt
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-xl border border-black bg-black px-2.5 py-1 font-comic text-sm font-bold text-amber-300">
                    {item.stats.totalXP} XP
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Tasks der Woche & Automatischer Kalender-Import */}
      <section className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-600 stroke-[2.5]" />
            <h3 className="font-comic text-xl uppercase tracking-wide text-slate-900">
              Wochen-Aufgaben ({state.chores.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Automatischer Kalender-Export (Alles auf einmal) */}
            <button
              type="button"
              title="Alle Aufgaben dieser Woche als Kalender-Datei (.ics) herunterladen / in Google Kalender importieren"
              onClick={() => {
                const allChores = [...state.chores, ...(state.kitchenChores || [])]
                GoogleCalendarService.downloadIcsFile(
                  allChores,
                  members,
                  state.householdName
                )
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-emerald-400 px-2.5 py-1 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300 font-bold active:translate-y-0.5"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Wochenplan in Kalender</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-amber-400 px-2.5 py-1 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300 font-bold"
            >
              <Settings2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Anpassen</span>
            </button>
          </div>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {state.chores.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              Aktuell keine Aufgaben angelegt. Klicke oben auf &quot;Tasks &amp; XP anpassen&quot;!
            </div>
          ) : (
            state.chores.map((chore) => {
              const due = getChoreDueInfo(chore)
              const assignee = members.find((m) => m.id === chore.assignedTo)

              return (
                <div
                  key={chore.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-black bg-amber-50/70 p-3 comic-shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-comic text-base text-slate-900">
                        {chore.title}
                      </span>
                      <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.2 font-comic text-[11px] font-bold text-black">
                        +{chore.xpReward || 30} XP
                      </span>
                      <span
                        className={`rounded-md border border-black px-1.5 py-0.2 font-comic text-[11px] uppercase font-bold ${
                          due.daysRemaining <= 0
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {due.statusText}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      {assignee && (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900">
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
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300 active:translate-y-0.5 font-bold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Abhaken</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* 4. Live-Aktivitäts-Log */}
      <section className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-600 stroke-[2.5]" />
            <h3 className="font-comic text-xl uppercase tracking-wide text-slate-900">
              Erledigt-Protokoll ({state.activityLog.length})
            </h3>
          </div>
          <span className="font-comic text-xs uppercase text-slate-500">
            Neueste zuerst
          </span>
        </div>

        <div className="mt-3.5 space-y-2">
          {state.activityLog.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black bg-slate-50 px-3.5 py-2.5 comic-shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{log.completedByAvatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-comic text-sm font-bold text-slate-900">
                          {log.title}
                        </span>
                        <span
                          className={`rounded-md border border-black px-1.5 py-0.2 font-comic text-[10px] uppercase font-bold ${
                            categoryColor[log.category] || 'bg-slate-200 text-black'
                          }`}
                        >
                          +{log.xpPoints} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Erledigt von <strong>{log.completedByName}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 font-comic text-xs text-slate-500">
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
