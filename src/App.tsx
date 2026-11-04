import { useEffect, useState } from 'react'
import {
  Bell,
  BellOff,
  Calendar,
  Check,
  Database,
  RefreshCcw,
  Rocket,
  Sparkles,
} from 'lucide-react'
import { DishwasherQuickToggle } from './components/dashboard/DishwasherQuickToggle'
import {
  TodayChoresList,
  getChoreDueInfo,
} from './components/dashboard/TodayChoresList'
import { WasteAlertBanner } from './components/dashboard/WasteAlertBanner'
import { LaundryTracker } from './components/laundry/LaundryTracker'
import { BottomNav } from './components/layout/BottomNav'
import { isFirebaseConfigured } from './config/firebase'
import { INITIAL_HOUSEHOLD_STATE } from './data/mockData'
import type {
  DishwasherStatus,
  HouseholdState,
  LaundryStage,
  LaundryType,
  NavigationTab,
  WasteType,
} from './types/household'

const STORAGE_KEY = 'apollo3000_household_state_v1'

const DISHWASHER_SEQUENCE: DishwasherStatus[] = [
  'empty',
  'loading',
  'running',
  'needs_unloading',
]

const LAUNDRY_SEQUENCE: LaundryStage[] = [
  'idle',
  'washing',
  'hanging',
  'folding',
  'done',
]

export function App() {
  const [state, setState] = useState<HouseholdState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved) as HouseholdState
      }
    } catch {
      // Fallback to mock data if localStorage fails
    }
    return INITIAL_HOUSEHOLD_STATE
  })

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard')
  const [simulateEveningAlert, setSimulateEveningAlert] = useState<boolean>(
    () => new Date().getHours() >= 18
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage quota errors
    }
  }, [state])

  const activeMember =
    state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0]

  // 1. Toggle active user (Person A <-> Person B)
  const handleSelectMember = (memberId: string) => {
    setState((prev) => ({ ...prev, activeMemberId: memberId }))
  }

  // 2. Dishwasher 1-Tap Status Toggle
  const handleCycleDishwasher = (targetStatus?: DishwasherStatus) => {
    setState((prev) => {
      const currentIdx = DISHWASHER_SEQUENCE.indexOf(prev.dishwasher.status)
      const nextStatus =
        targetStatus ??
        DISHWASHER_SEQUENCE[(currentIdx + 1) % DISHWASHER_SEQUENCE.length]

      return {
        ...prev,
        dishwasher: {
          status: nextStatus,
          lastHandledBy: prev.activeMemberId,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  // 3. Laundry State Machine Transition
  const handleAdvanceLaundry = (
    laundryId: LaundryType,
    targetStage?: LaundryStage
  ) => {
    setState((prev) => ({
      ...prev,
      laundry: prev.laundry.map((item) => {
        if (item.id !== laundryId) return item
        const currentIdx = LAUNDRY_SEQUENCE.indexOf(item.stage)
        const nextStage =
          targetStage ??
          LAUNDRY_SEQUENCE[(currentIdx + 1) % LAUNDRY_SEQUENCE.length]

        return {
          ...item,
          stage: nextStage,
          startedAt:
            nextStage === 'washing'
              ? new Date().toISOString()
              : nextStage === 'idle'
                ? null
                : item.startedAt,
          assignedTo: nextStage === 'idle' ? null : prev.activeMemberId,
        }
      }),
    }))
  }

  // 4. Waste Management Actions
  const handleMarkWastePutOut = (wasteId: WasteType) => {
    setState((prev) => ({
      ...prev,
      waste: prev.waste.map((w) => {
        if (w.id !== wasteId) return w
        const next = new Date(w.nextPickupDate)
        next.setDate(next.getDate() + 14)
        const y = next.getFullYear()
        const m = String(next.getMonth() + 1).padStart(2, '0')
        const d = String(next.getDate()).padStart(2, '0')
        return {
          ...w,
          nextPickupDate: `${y}-${m}-${d}`,
          assignedTo:
            w.assignedTo === 'member-a' ? 'member-b' : 'member-a',
        }
      }),
    }))
  }

  const handleToggleWasteReminder = (wasteId: WasteType) => {
    setState((prev) => ({
      ...prev,
      waste: prev.waste.map((w) =>
        w.id === wasteId
          ? { ...w, reminderEveningBefore: !w.reminderEveningBefore }
          : w
      ),
    }))
  }

  // 5. Complete Chore & Rotate Person A <-> Person B
  const handleCompleteChore = (choreId: string) => {
    const todayStr = new Date().toISOString().split('T')[0]
    setState((prev) => ({
      ...prev,
      chores: prev.chores.map((chore) => {
        if (chore.id !== choreId) return chore
        const nextPerson =
          chore.rotationOrder[0] === chore.assignedTo
            ? chore.rotationOrder[1]
            : chore.rotationOrder[0]
        return {
          ...chore,
          lastCompletedAt: todayStr,
          assignedTo: nextPerson,
        }
      }),
    }))
  }

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY)
    setState(INITIAL_HOUSEHOLD_STATE)
  }

  // Badges for BottomNav
  const activeLaundryCount = state.laundry.filter(
    (l) => l.stage !== 'idle' && l.stage !== 'done'
  ).length
  const dueChoresCount = state.chores.filter(
    (c) => getChoreDueInfo(c).isDueOrOverdue
  ).length
  const urgentWasteCount = state.waste.filter((w) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [y, m, d] = w.nextPickupDate.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    const diff = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff >= 0 && diff <= 1
  }).length

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Mobile-First Container (390px–430px optimal viewport) */}
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-4 pb-28 pt-safe">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-white">
                    Apollo 3000
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      isFirebaseConfigured
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-indigo-500/15 text-indigo-300'
                    }`}
                  >
                    <Database className="h-2.5 w-2.5" />
                    {isFirebaseConfigured ? 'Firebase Live' : 'Mock-Modus'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  2-Personen Haushalts-Cockpit
                </p>
              </div>
            </div>

            {/* Active Member Switcher */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-1">
              {state.members.map((member) => {
                const isSelected = member.id === activeMember.id
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectMember(member.id)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{member.avatar}</span>
                    <span>{member.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 space-y-4">
          {activeTab === 'dashboard' && (
            <>
              <WasteAlertBanner
                wasteItems={state.waste}
                members={state.members}
                currentHour={new Date().getHours()}
                simulateEveningAlert={simulateEveningAlert}
                onToggleSimulateEvening={() =>
                  setSimulateEveningAlert((prev) => !prev)
                }
                onMarkPutOut={handleMarkWastePutOut}
              />

              <DishwasherQuickToggle
                dishwasher={state.dishwasher}
                members={state.members}
                onCycleStatus={handleCycleDishwasher}
              />

              <TodayChoresList
                chores={state.chores}
                members={state.members}
                onCompleteChore={handleCompleteChore}
              />

              {/* Compact Laundry Teaser on Dashboard */}
              <section className="rounded-3xl border border-slate-800/90 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Aktive Wäsche-Pipeline
                    </h2>
                    <p className="text-xs text-slate-400">
                      {activeLaundryCount} von 6 Sorten in Bearbeitung
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('laundry')}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-slate-700"
                  >
                    Alle 6 Sorten →
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === 'laundry' && (
            <LaundryTracker
              laundry={state.laundry}
              members={state.members}
              onAdvanceStage={handleAdvanceLaundry}
            />
          )}

          {activeTab === 'waste' && (
            <section className="space-y-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Müllkalender & Vorabend-Reminder
                </span>
                <h2 className="mt-0.5 text-lg font-bold text-slate-100">
                  5 Fraktionen im Überblick
                </h2>
                <p className="text-xs text-slate-400">
                  Erinnerung am Vorabend ab 18:00 Uhr automatisch im Dashboard
                </p>
              </div>

              {state.waste.map((item) => {
                const assignee = state.members.find(
                  (m) => m.id === item.assignedTo
                )
                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-800/90 bg-slate-900/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full ring-4 ring-slate-800"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">
                            {item.label}
                          </h3>
                          <p className="text-xs text-slate-400">{item.notes}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleWasteReminder(item.id)}
                        className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-medium transition ${
                          item.reminderEveningBefore
                            ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                            : 'border-slate-800 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {item.reminderEveningBefore ? (
                          <>
                            <Bell className="h-3 w-3" />
                            <span>18:00 Vorabend</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="h-3 w-3" />
                            <span>Stumm</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/70 pt-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Nächste Abholung:{' '}
                          <strong>{item.nextPickupDate}</strong>
                        </span>
                        {assignee && (
                          <span className="text-slate-400">
                            · {assignee.avatar} {assignee.name}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkWastePutOut(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-slate-700"
                      >
                        <Check className="h-3 w-3" />
                        <span>Erledigt (+14 Tg.)</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
                  Wochenplan & Fairness
                </span>
                <h2 className="mt-0.5 text-lg font-bold text-slate-100">
                  2-Personen A/B-Rotation
                </h2>
                <p className="text-xs text-slate-400">
                  Jede erledigte Standard-Aufgabe wechselt automatisch zwischen{' '}
                  {state.members[0]?.name} und {state.members[1]?.name}.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {state.members.map((m) => {
                    const assignedChores = state.chores.filter(
                      (c) => c.assignedTo === m.id
                    ).length
                    const assignedLaundry = state.laundry.filter(
                      (l) => l.assignedTo === m.id && l.stage !== 'done'
                    ).length

                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.avatar}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-100">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {m.roleLabel}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Putzplan: {assignedChores}</span>
                          <span>Wäsche: {assignedLaundry}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <TodayChoresList
                chores={state.chores}
                members={state.members}
                onCompleteChore={handleCompleteChore}
              />

              <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>Mock-Daten auf Ausgangszustand zurücksetzen</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        badges={{
          dashboard: dueChoresCount + urgentWasteCount,
          laundry: activeLaundryCount,
          waste: urgentWasteCount,
          schedule: dueChoresCount,
        }}
      />
    </div>
  )
}

export default App
