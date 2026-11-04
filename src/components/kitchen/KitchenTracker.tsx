import { useState } from 'react'
import {
  CalendarPlus,
  CheckCircle2,
  ChefHat,
  Circle,
  Clock,
  Plus,
  Sparkles,
} from 'lucide-react'
import { GoogleCalendarService } from '../../services/googleCalendar'
import type {
  HouseholdMember,
  KitchenChore,
  StandardChore,
} from '../../types/household'
import { getChoreDueInfo } from '../dashboard/TodayChoresList'

interface KitchenTrackerProps {
  kitchenChores: KitchenChore[]
  members: HouseholdMember[]
  calendarEmail?: string
  onCompleteKitchenChore: (choreId: string) => void
  onAddKitchenChore: (chore: KitchenChore) => void
}

export function KitchenTracker({
  kitchenChores,
  members,
  calendarEmail,
  onCompleteKitchenChore,
  onAddKitchenChore,
}: KitchenTrackerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [intervalDays, setIntervalDays] = useState(7)
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [xpReward, setXpReward] = useState(20)

  const sortedChores = [...kitchenChores].sort((a, b) => {
    return (
      getChoreDueInfo(a as unknown as StandardChore).daysRemaining -
      getChoreDueInfo(b as unknown as StandardChore).daysRemaining
    )
  })

  const handleOpenGoogleCalendar = (chore: KitchenChore) => {
    const assignee = members.find((m) => m.id === chore.assignedTo)
    const assigneeName = assignee ? assignee.name : 'Haushalt'
    const intentUrl = GoogleCalendarService.createWebIntentUrl(
      chore as unknown as StandardChore,
      assigneeName,
      calendarEmail
    )
    window.open(intentUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newKitchenChore: KitchenChore = {
      id: `kitchen-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      intervalDays: Number(intervalDays) || 7,
      estimatedMinutes: Number(estimatedMinutes) || 15,
      xpReward: Number(xpReward) || 20,
      lastCompletedAt: new Date().toISOString().split('T')[0],
      assignedTo: members[0]?.id || 'member-a',
      rotationOrder: [
        members[0]?.id || 'member-a',
        members[1]?.id || 'member-b',
      ],
    }

    onAddKitchenChore(newKitchenChore)
    setTitle('')
    setDescription('')
    setIsCreating(false)
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-comic text-xs uppercase tracking-wider text-amber-700">
              ★ KÜCHEN-KOMMANDO 3000 ★
            </span>
            <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900 leading-tight">
              Alle Küchen-Todos
            </h2>
            <p className="text-xs font-medium text-slate-600">
              Spüle, Herd, Kühlschrank, Backofen &amp; Co.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <ChefHat className="h-7 w-7 stroke-[2.5]" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-black bg-amber-400 py-2 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300 font-bold"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Neues Küchen-Todo hinzufügen</span>
        </button>
      </div>

      {/* Formular für neues Küchen-Todo */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow space-y-3"
        >
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
            <span className="font-comic text-sm uppercase text-slate-900 font-bold">
              Neues Küchen-Todo anlegen
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="font-comic text-xs uppercase text-slate-500 hover:text-black"
            >
              Abbrechen
            </button>
          </div>

          <div>
            <label className="block font-comic text-xs uppercase text-amber-800">
              Titel
            </label>
            <input
              type="text"
              required
              placeholder="z.B. Dunstabzugshaube Filter reinigen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-black bg-amber-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block font-comic text-xs uppercase text-amber-800">
              Beschreibung
            </label>
            <input
              type="text"
              placeholder="Details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-black bg-amber-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-comic text-xs uppercase text-amber-800">
                Alle (Tage)
              </label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border-2 border-black bg-amber-50 px-2 py-1.5 text-center font-comic text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-comic text-xs uppercase text-amber-800">
                Dauer (Min.)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border-2 border-black bg-amber-50 px-2 py-1.5 text-center font-comic text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-comic text-xs uppercase text-amber-800">
                XP
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border-2 border-black bg-amber-400 px-2 py-1.5 text-center font-comic text-sm font-bold text-black"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-emerald-400 py-2 font-comic text-xs uppercase text-black font-bold comic-shadow-sm hover:bg-emerald-300"
          >
            <span>In Küchen-Plan aufnehmen</span>
          </button>
        </form>
      )}

      {/* Küchen-Todos Liste */}
      <div className="space-y-3">
        {sortedChores.map((chore) => {
          const due = getChoreDueInfo(chore as unknown as StandardChore)
          const assignee = members.find((m) => m.id === chore.assignedTo)

          return (
            <div
              key={chore.id}
              className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onCompleteKitchenChore(chore.id)}
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:text-emerald-500 active:scale-90"
                >
                  <Circle
                    className={`h-7 w-7 stroke-[2.5] ${
                      due.isDueOrOverdue ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-comic text-lg uppercase tracking-wide text-slate-900">
                        {chore.title}
                      </h3>
                      <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.2 font-comic text-xs font-bold text-black">
                        +{chore.xpReward || 20} XP
                      </span>
                      <span
                        className={`rounded-md border border-black px-1.5 py-0.5 font-comic text-xs uppercase font-bold ${
                          due.daysRemaining < 0
                            ? 'bg-rose-500 text-white'
                            : due.daysRemaining === 0
                              ? 'bg-amber-400 text-black'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {due.statusText}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Als Google Kalender Termin anlegen"
                      onClick={() => handleOpenGoogleCalendar(chore)}
                      className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-amber-300 px-2.5 py-1 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-200"
                    >
                      <CalendarPlus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>In Kalender</span>
                    </button>
                  </div>

                  {chore.description && (
                    <p className="mt-1 text-xs text-slate-600">
                      {chore.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      {assignee && (
                        <span className="inline-flex items-center gap-1 rounded-lg border-2 border-black bg-amber-100 px-2 py-0.5 text-black">
                          <span>{assignee.avatar}</span>
                          <span className="font-comic text-xs">{assignee.name}</span>
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="h-3 w-3" />~{chore.estimatedMinutes} Min. · alle{' '}
                      {chore.intervalDays} Tg.
                    </span>
                  </div>
                </div>
              </div>

              {/* Schneller Erledigt-Button */}
              <div className="mt-3 flex justify-end border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => onCompleteKitchenChore(chore.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1 font-comic text-xs uppercase text-black font-bold comic-shadow-sm hover:bg-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Erledigt! (+{chore.xpReward} XP)</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 pt-1">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Erledigte Aufgaben rotieren sofort zum Partner</span>
      </div>
    </div>
  )
}
