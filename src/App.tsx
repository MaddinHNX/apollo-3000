import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  ExternalLink,
  Flame,
  RefreshCcw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { HouseholdAuthModal } from './components/auth/HouseholdAuthModal'
import { DishwasherQuickToggle } from './components/dashboard/DishwasherQuickToggle'
import {
  TodayChoresList,
  getChoreDueInfo,
} from './components/dashboard/TodayChoresList'
import { WasteAlertBanner } from './components/dashboard/WasteAlertBanner'
import { WeekDashboard } from './components/dashboard/WeekDashboard'
import { LaundryTracker } from './components/laundry/LaundryTracker'
import { BottomNav } from './components/layout/BottomNav'
import { isFirebaseConfigured, subscribeToHousehold, syncHouseholdState } from './config/firebase'
import { INITIAL_HOUSEHOLD_STATE } from './data/mockData'
import type {
  DishwasherStatus,
  HouseholdState,
  LaundryStage,
  LaundryType,
  NavigationTab,
  TaskActivityLog,
  WasteType,
} from './types/household'

const STORAGE_KEY = 'apollo3000_household_state_v3'

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [simulateEveningAlert, setSimulateEveningAlert] = useState<boolean>(
    () => new Date().getHours() >= 18
  )

  // Firestore Sync Listener wenn konfiguriert
  useEffect(() => {
    if (isFirebaseConfigured && state.householdId) {
      const unsubscribe = subscribeToHousehold(state.householdId, (remoteState) => {
        setState((prev) => ({
          ...prev,
          ...remoteState,
        }))
      })
      return () => unsubscribe()
    }
  }, [state.householdId])

  // LocalStorage Persistenz
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore
    }
  }, [state])

  const activeMember =
    state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0]

  // Synchronisation trigger
  const updateStateAndSync = (updater: (prev: HouseholdState) => HouseholdState) => {
    setState((prev) => {
      const next = updater(prev)
      if (isFirebaseConfigured && next.householdId) {
        syncHouseholdState(next.householdId, next).catch(console.error)
      }
      return next
    })
  }

  // Switch Active Person
  const handleSelectMember = (memberId: string) => {
    updateStateAndSync((prev) => ({ ...prev, activeMemberId: memberId }))
  }

  // Dishwasher Toggle mit XP Logging
  const handleCycleDishwasher = (targetStatus?: DishwasherStatus) => {
    updateStateAndSync((prev) => {
      const currentIdx = DISHWASHER_SEQUENCE.indexOf(prev.dishwasher.status)
      const nextStatus =
        targetStatus ??
        DISHWASHER_SEQUENCE[(currentIdx + 1) % DISHWASHER_SEQUENCE.length]

      const isUnloadingDone = nextStatus === 'empty'
      const newLogs: TaskActivityLog[] = isUnloadingDone
        ? [
            {
              id: `log-${Date.now()}`,
              title: 'Spülmaschine ausgeräumt',
              category: 'dishwasher',
              completedBy: prev.activeMemberId,
              completedByName: activeMember.name,
              completedByAvatar: activeMember.avatar,
              timestamp: new Date().toISOString(),
              xpPoints: 15,
            },
            ...prev.activityLog,
          ]
        : prev.activityLog

      return {
        ...prev,
        dishwasher: {
          status: nextStatus,
          lastHandledBy: prev.activeMemberId,
          updatedAt: new Date().toISOString(),
        },
        activityLog: newLogs.slice(0, 30),
      }
    })
  }

  // Laundry Stage Advancement mit Logging
  const handleAdvanceLaundry = (
    laundryId: LaundryType,
    targetStage?: LaundryStage
  ) => {
    updateStateAndSync((prev) => {
      const targetItem = prev.laundry.find((l) => l.id === laundryId)
      const currentIdx = targetItem ? LAUNDRY_SEQUENCE.indexOf(targetItem.stage) : 0
      const nextStage =
        targetStage ??
        LAUNDRY_SEQUENCE[(currentIdx + 1) % LAUNDRY_SEQUENCE.length]

      const isDone = nextStage === 'done'
      const newLogs: TaskActivityLog[] = isDone && targetItem
        ? [
            {
              id: `log-${Date.now()}`,
              title: `${targetItem.label} im Schrank verstaut`,
              category: 'laundry',
              completedBy: prev.activeMemberId,
              completedByName: activeMember.name,
              completedByAvatar: activeMember.avatar,
              timestamp: new Date().toISOString(),
              xpPoints: 20,
            },
            ...prev.activityLog,
          ]
        : prev.activityLog

      return {
        ...prev,
        laundry: prev.laundry.map((item) => {
          if (item.id !== laundryId) return item
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
        activityLog: newLogs.slice(0, 30),
      }
    })
  }

  // Waste Management mit XP Logging
  const handleMarkWastePutOut = (wasteId: WasteType) => {
    updateStateAndSync((prev) => {
      const item = prev.waste.find((w) => w.id === wasteId)
      const newLogs: TaskActivityLog[] = item
        ? [
            {
              id: `log-${Date.now()}`,
              title: `${item.label} an die Straße gestellt`,
              category: 'waste',
              completedBy: prev.activeMemberId,
              completedByName: activeMember.name,
              completedByAvatar: activeMember.avatar,
              timestamp: new Date().toISOString(),
              xpPoints: 25,
            },
            ...prev.activityLog,
          ]
        : prev.activityLog

      return {
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
        activityLog: newLogs.slice(0, 30),
      }
    })
  }

  // Complete Chore with Auto A/B Rotation & XP Logging
  const handleCompleteChore = (choreId: string) => {
    const todayStr = new Date().toISOString().split('T')[0]
    updateStateAndSync((prev) => {
      const chore = prev.chores.find((c) => c.id === choreId)
      const newLogs: TaskActivityLog[] = chore
        ? [
            {
              id: `log-${Date.now()}`,
              title: chore.title,
              category: 'chore',
              completedBy: prev.activeMemberId,
              completedByName: activeMember.name,
              completedByAvatar: activeMember.avatar,
              timestamp: new Date().toISOString(),
              xpPoints: 30,
            },
            ...prev.activityLog,
          ]
        : prev.activityLog

      return {
        ...prev,
        chores: prev.chores.map((c) => {
          if (c.id !== choreId) return c
          const nextPerson =
            c.rotationOrder[0] === c.assignedTo
              ? c.rotationOrder[1]
              : c.rotationOrder[0]
          return {
            ...c,
            lastCompletedAt: todayStr,
            assignedTo: nextPerson,
          }
        }),
        activityLog: newLogs.slice(0, 30),
      }
    })
  }

  const handleUpdateHouseholdId = (newId: string) => {
    updateStateAndSync((prev) => ({
      ...prev,
      householdId: newId,
    }))
  }

  const handleGoogleUserConnected = (user: { name: string; email: string; avatar: string }) => {
    updateStateAndSync((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === prev.activeMemberId
          ? { ...m, name: user.name, email: user.email }
          : m
      ),
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
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-black bg-rose-500 px-1.5 py-0.2 font-comic text-[10px] uppercase text-white comic-shadow-sm transition hover:bg-rose-400"
                  >
                    <Users className="h-2.5 w-2.5 stroke-[2.5]" />
                    <span>{state.householdId}</span>
                  </button>
                </div>
                <p className="text-[11px] font-semibold text-amber-200/70">
                  {state.householdName}
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
                    className={`flex items-center gap-1 rounded-xl px-2 py-1 font-comic text-xs uppercase tracking-wide transition ${
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
              {/* Figma Board Link */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-amber-400/15 p-3 comic-shadow-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400 stroke-[2.5]" />
                  <span className="font-comic text-xs uppercase tracking-wide text-amber-300">
                    Vintage Pop-Art Design Board
                  </span>
                </div>
                <a
                  href="https://www.figma.com/design/yGBQ4VkH5lbOjLPAIRHEyX"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-black bg-amber-400 px-2 py-0.5 font-comic text-[11px] uppercase text-black"
                >
                  <span>Figma</span>
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

              {/* Weekly Dashboard Teaser */}
              <section className="rounded-3xl border-3 border-black bg-[#22150d] p-4 comic-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-comic text-lg uppercase tracking-wide text-white">
                      Wochen-Dashboard
                    </h2>
                    <p className="text-xs text-amber-100/70">
                      {state.activityLog.length} Erledigungen diese Woche
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('week')}
                    className="rounded-2xl border-2 border-black bg-amber-400 px-3.5 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300"
                  >
                    Zur Übersicht →
                  </button>
                </div>
              </section>
            </>
          )}

          {/* Neues Wochen-Dashboard */}
          {activeTab === 'week' && (
            <WeekDashboard
              state={state}
              members={state.members}
              onCompleteChore={handleCompleteChore}
            />
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

      {/* Household Auth Modal */}
      <HouseholdAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        householdState={state}
        activeMember={activeMember}
        onUpdateHouseholdId={handleUpdateHouseholdId}
        onGoogleUserConnected={handleGoogleUserConnected}
      />

      {/* Fixed Mobile Bottom Navigation mit Wochen-Tab */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        badges={{
          dashboard: dueChoresCount + urgentWasteCount,
          week: dueChoresCount,
          laundry: activeLaundryCount,
          waste: urgentWasteCount,
          schedule: dueChoresCount,
        }}
      />
    </div>
  )
}

export default App
