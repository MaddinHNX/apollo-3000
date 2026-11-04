import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  ExternalLink,
  Flame,
  RefreshCcw,
  Sparkles,
  Zap,
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

const STORAGE_KEY = 'apollo3000_household_state_v2'

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
      // Fallback
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
      // Ignore quota errors
    }
  }, [state])

  const activeMember =
    state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0]

  // Switch Active Person
  const handleSelectMember = (memberId: string) => {
    setState((prev) => ({ ...prev, activeMemberId: memberId }))
  }

  // Dishwasher Toggle
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

  // Laundry Stage Advancement
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

  // Waste Management
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

  // Complete Chore with Auto A/B Rotation
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

  // Badges
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
    <div className="min-h-dvh bg-[#150e09] text-[#fffdf5] comic-dots">
      {/* Mobile-First Container (390px Viewport) */}
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-4 pb-28 pt-safe">
        {/* Vintage Comic Header */}
        <header className="sticky top-0 z-30 -mx-4 mb-4 border-b-3 border-black bg-[#1b1009]/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-tr from-amber-400 to-rose-500 text-black comic-shadow-sm">
                <Flame className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-comic text-2xl tracking-wider text-amber-300">
                    APOLLO 3000
                  </h1>
                  <span className="rounded-md border border-black bg-rose-500 px-1.5 py-0.2 font-comic text-[10px] uppercase text-white comic-shadow-sm">
                    {isFirebaseConfigured ? 'FIREBASE' : 'COMIC ED.'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-amber-200/70">
                  2-Helden Haushalts-Kommando
                </p>
              </div>
            </div>

            {/* Member Switcher */}
            <div className="flex items-center gap-1 rounded-2xl border-2 border-black bg-[#100905] p-1 comic-shadow-sm">
              {state.members.map((member) => {
                const isSelected = member.id === activeMember.id
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectMember(member.id)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-comic text-xs uppercase tracking-wide transition ${
                      isSelected
                        ? 'border border-black bg-amber-400 text-black font-bold comic-shadow-sm'
                        : 'text-amber-200/50 hover:text-amber-100'
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

        {/* Main Content */}
        <main className="flex-1 space-y-4">
          {activeTab === 'dashboard' && (
            <>
              {/* Figma Board Quick Link Notice */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-amber-400/15 p-3 comic-shadow-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400 stroke-[2.5]" />
                  <span className="font-comic text-xs uppercase tracking-wide text-amber-300">
                    Figma Design Board aktiv
                  </span>
                </div>
                <a
                  href="https://www.figma.com/design/yGBQ4VkH5lbOjLPAIRHEyX"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-black bg-amber-400 px-2 py-0.5 font-comic text-[11px] uppercase text-black"
                >
                  <span>Board öffnen</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

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

              {/* Laundry Teaser */}
              <section className="rounded-3xl border-3 border-black bg-[#22150d] p-4 comic-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-comic text-lg uppercase tracking-wide text-white">
                      Wäsche-Pipeline
                    </h2>
                    <p className="text-xs text-amber-100/70">
                      {activeLaundryCount} von 6 Sorten in Arbeit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('laundry')}
                    className="rounded-2xl border-2 border-black bg-amber-400 px-3.5 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300"
                  >
                    Alle Sorten →
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
              <div className="rounded-3xl border-3 border-black bg-[#24150b] p-4 comic-shadow">
                <span className="font-comic text-xs uppercase tracking-wider text-amber-400">
                  MÜLL-MISSIONEN
                </span>
                <h2 className="font-comic text-2xl uppercase tracking-wide text-white">
                  5 Fraktionen
                </h2>
                <p className="text-xs text-amber-100/70">
                  Vorabend-Alarmierung automatisch ab 18:00 Uhr
                </p>
              </div>

              {state.waste.map((item) => {
                const assignee = state.members.find(
                  (m) => m.id === item.assignedTo
                )
                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border-3 border-black bg-[#1f1007] p-4 comic-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border-2 border-black"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <h3 className="font-comic text-xl uppercase tracking-wide text-white">
                            {item.label}
                          </h3>
                          <p className="text-xs text-amber-100/70">{item.notes}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t-2 border-black/80 pt-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>
                          Abholung: <strong>{item.nextPickupDate}</strong>
                        </span>
                        {assignee && (
                          <span className="text-amber-300/80">
                            · {assignee.avatar} {assignee.name}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkWastePutOut(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300"
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Fertig (+14 Tg.)</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="space-y-4">
              <div className="rounded-3xl border-3 border-black bg-[#28150c] p-4 comic-shadow">
                <span className="font-comic text-xs uppercase tracking-wider text-rose-400">
                  TEAM-FAIRNESS
                </span>
                <h2 className="font-comic text-2xl uppercase tracking-wide text-white">
                  A/B-Rotation
                </h2>
                <p className="text-xs text-amber-100/70">
                  Gerechte Verteilung für {state.members[0]?.name} &amp;{' '}
                  {state.members[1]?.name}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {state.members.map((m) => {
                    const assignedChores = state.chores.filter(
                      (c) => c.assignedTo === m.id
                    ).length

                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border-2 border-black bg-[#160c07] p-3 comic-shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{m.avatar}</span>
                          <div>
                            <div className="font-comic text-base text-amber-300">
                              {m.name}
                            </div>
                            <div className="text-[10px] font-semibold text-amber-200/50">
                              {m.roleLabel}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-semibold text-amber-100/80">
                          Aufgaben: {assignedChores}
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

              <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-[#1c0f08] px-4 py-3 text-xs text-amber-200/70 comic-shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Demo-Zustand zurücksetzen</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="inline-flex items-center gap-1 rounded-xl border border-black bg-amber-400 px-2.5 py-1 font-comic text-xs uppercase text-black"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

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
