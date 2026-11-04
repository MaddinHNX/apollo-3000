import { useState } from 'react'
import {
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import type { HouseholdState, StandardChore } from '../../types/household'

interface ChoreSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  householdState: HouseholdState
  onSaveChore: (chore: StandardChore) => void
  onDeleteChore: (choreId: string) => void
}

export function ChoreSettingsModal({
  isOpen,
  onClose,
  householdState,
  onSaveChore,
  onDeleteChore,
}: ChoreSettingsModalProps) {
  const [editingChore, setEditingChore] = useState<StandardChore | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [intervalDays, setIntervalDays] = useState(7)
  const [estimatedMinutes, setEstimatedMinutes] = useState(20)
  const [xpReward, setXpReward] = useState(40)

  if (!isOpen) return null

  const handleStartCreate = () => {
    setTitle('')
    setDescription('')
    setIntervalDays(7)
    setEstimatedMinutes(20)
    setXpReward(30)
    setEditingChore(null)
    setIsCreating(true)
  }

  const handleStartEdit = (chore: StandardChore) => {
    setTitle(chore.title)
    setDescription(chore.description || '')
    setIntervalDays(chore.intervalDays)
    setEstimatedMinutes(chore.estimatedMinutes)
    setXpReward(chore.xpReward || 30)
    setEditingChore(chore)
    setIsCreating(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const memberIds = householdState.members.map((m) => m.id)
    const rotationOrder: [string, string] = [
      memberIds[0] || 'member-a',
      memberIds[1] || 'member-b',
    ]

    const updatedChore: StandardChore = {
      id: editingChore ? editingChore.id : `chore-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      intervalDays: Number(intervalDays) || 7,
      estimatedMinutes: Number(estimatedMinutes) || 15,
      xpReward: Number(xpReward) || 25,
      lastCompletedAt: editingChore
        ? editingChore.lastCompletedAt
        : new Date().toISOString().split('T')[0],
      assignedTo: editingChore
        ? editingChore.assignedTo
        : householdState.activeMemberId,
      rotationOrder: editingChore ? editingChore.rotationOrder : rotationOrder,
    }

    onSaveChore(updatedChore)
    setIsCreating(false)
    setEditingChore(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border-3 border-black bg-[#23140a] p-5 text-white comic-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border-2 border-black bg-rose-500 p-1 text-white comic-shadow-sm hover:bg-rose-400"
        >
          <X className="h-4 w-4 stroke-[3]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <Zap className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-comic text-xl uppercase tracking-wide text-amber-300">
              Aufgaben- &amp; XP-Katalog
            </h2>
            <p className="text-xs text-amber-100/70">
              Alle Tasks anpassen &amp; XP individuell vergeben
            </p>
          </div>
        </div>

        {/* Action: Neue Aufgabe anlegen Button */}
        {!isCreating && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black bg-amber-400 py-2.5 font-comic text-sm uppercase text-black comic-shadow-sm transition hover:bg-amber-300 active:translate-y-0.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Neue Aufgabe hinzufügen</span>
          </button>
        )}

        {/* Formular für Hinzufügen / Bearbeiten */}
        {isCreating && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-2xl border-2 border-black bg-[#160c07] p-4 comic-shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-black/60 pb-2">
              <span className="font-comic text-sm uppercase text-amber-300">
                {editingChore ? 'Aufgabe bearbeiten' : 'Neue Aufgabe anlegen'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setEditingChore(null)
                }}
                className="font-comic text-xs uppercase text-amber-200/60 hover:text-white"
              >
                Abbrechen
              </button>
            </div>

            <div>
              <label
                htmlFor="choreTitleInput"
                className="block font-comic text-xs uppercase text-amber-400"
              >
                Titel der Aufgabe
              </label>
              <input
                id="choreTitleInput"
                type="text"
                required
                placeholder="z.B. Kühlschrank auswischen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-black bg-[#25150c] px-3 py-1.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label
                htmlFor="choreDescInput"
                className="block font-comic text-xs uppercase text-amber-400"
              >
                Beschreibung (optional)
              </label>
              <input
                id="choreDescInput"
                type="text"
                placeholder="Details zur Durchführung..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-black bg-[#25150c] px-3 py-1.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="intervalInput"
                  className="block font-comic text-xs uppercase text-amber-400"
                >
                  Alle (Tage)
                </label>
                <input
                  id="intervalInput"
                  type="number"
                  min="1"
                  max="365"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border-2 border-black bg-[#25150c] px-2 py-1.5 text-center font-comic text-sm text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="minutesInput"
                  className="block font-comic text-xs uppercase text-amber-400"
                >
                  Dauer (Min.)
                </label>
                <input
                  id="minutesInput"
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border-2 border-black bg-[#25150c] px-2 py-1.5 text-center font-comic text-sm text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="xpRewardInput"
                  className="block font-comic text-xs uppercase text-amber-400"
                >
                  XP-Belohnung
                </label>
                <input
                  id="xpRewardInput"
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
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-emerald-400 py-2 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300 active:translate-y-0.5"
            >
              <span>Speichern &amp; Übernehmen</span>
            </button>
          </form>
        )}

        {/* Standard-XP Übersicht für Kern-Kategorien */}
        <div className="mt-4 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <div className="flex items-center gap-1.5 font-comic text-xs uppercase text-amber-400">
            <Trophy className="h-4 w-4 stroke-[2.5]" />
            <span>Feste Haushalts-XP im System:</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-black bg-[#28150a] p-2">
              <span className="font-comic text-[11px] text-amber-200/80">Spülmaschine</span>
              <div className="font-comic text-base font-bold text-sky-400">
                +{householdState.dishwasher.xpReward || 15} XP
              </div>
            </div>
            <div className="rounded-xl border border-black bg-[#28150a] p-2">
              <span className="font-comic text-[11px] text-amber-200/80">Wäsche-Gang</span>
              <div className="font-comic text-base font-bold text-emerald-400">
                +20-35 XP
              </div>
            </div>
            <div className="rounded-xl border border-black bg-[#28150a] p-2">
              <span className="font-comic text-[11px] text-amber-200/80">Müllabfuhr</span>
              <div className="font-comic text-base font-bold text-rose-400">
                +25 XP
              </div>
            </div>
          </div>
        </div>

        {/* Liste aller aktuellen Aufgaben mit Bearbeiten & Löschen */}
        <div className="mt-4 space-y-2.5">
          <span className="font-comic text-xs uppercase tracking-wider text-amber-400">
            Alle Aufgaben im Plan ({householdState.chores.length}):
          </span>

          {householdState.chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center justify-between gap-2 rounded-2xl border-2 border-black bg-[#1a0e08] p-3 comic-shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-comic text-base text-white">
                    {chore.title}
                  </span>
                  <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.2 font-comic text-xs font-bold text-black">
                    +{chore.xpReward || 30} XP
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-amber-100/70">
                  <span>alle {chore.intervalDays} Tage</span>
                  <span>· ~{chore.estimatedMinutes} Min.</span>
                  {chore.description && (
                    <span className="text-amber-200/50">· {chore.description}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Aufgabe bearbeiten"
                  onClick={() => handleStartEdit(chore)}
                  className="rounded-xl border border-black bg-slate-800 p-1.5 text-amber-300 hover:bg-slate-700 active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Aufgabe entfernen"
                  onClick={() => onDeleteChore(chore.id)}
                  className="rounded-xl border border-black bg-rose-500/80 p-1.5 text-white hover:bg-rose-500 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-amber-300/60">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>XP werden beim Erledigen sofort im Scoreboard gutgeschrieben</span>
        </div>
      </div>
    </div>
  )
}
