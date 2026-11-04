import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  LogIn,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'
import maidIcon from './assets/icon-maid.jpg'
import { HouseholdAuthModal } from './components/auth/HouseholdAuthModal'
import { DishwasherQuickToggle } from './components/dashboard/DishwasherQuickToggle'
import { PersonDetailModal } from './components/dashboard/PersonDetailModal'
import {
  TodayChoresList,
  getChoreDueInfo,
} from './components/dashboard/TodayChoresList'
import { WasteAlertBanner } from './components/dashboard/WasteAlertBanner'
import { WeekDashboard } from './components/dashboard/WeekDashboard'
import { LaundryTracker } from './components/laundry/LaundryTracker'
import { BottomNav } from './components/layout/BottomNav'
import { ChoreSettingsModal } from './components/settings/ChoreSettingsModal'
import { isFirebaseConfigured, subscribeToHousehold, syncHouseholdState } from './config/firebase'
import { INITIAL_HOUSEHOLD_STATE } from './data/mockData'
import type {
  DishwasherStatus,
  HouseholdMember,
  HouseholdState,
  LaundryStage,
  LaundryType,
  NavigationTab,
  StandardChore,
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
  const [isChoreSettingsOpen, setIsChoreSettingsOpen] = useState(false)
  const [inspectingMember, setInspectingMember] = useState<HouseholdMember | null>(null)
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
          ...prev.dishwasher,
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
      const earnedXP = chore?.xpReward || 30
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
              xpPoints: earnedXP,
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

  // Save / Update Chore
  const handleSaveChore = (choreToSave: StandardChore) => {
    updateStateAndSync((prev) => {
      const exists = prev.chores.some((c) => c.id === choreToSave.id)
      const nextChores = exists
        ? prev.chores.map((c) => (c.id === choreToSave.id ? choreToSave : c))
        : [...prev.chores, choreToSave]
      return {
        ...prev,
        chores: nextChores,
      }
    })
  }

  // Delete Chore
  const handleDeleteChore = (choreId: string) => {
    updateStateAndSync((prev) => ({
      ...prev,
      chores: prev.chores.filter((c) => c.id !== choreId),
    }))
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

  // Google Kalender URL speichern
  const handleSaveCalendarUrl = (calendarUrl: string) => {
    updateStateAndSync((prev) => ({
      ...prev,
      googleCalendarUrl: calendarUrl,
    }))
  }

  // Haushalt bei Null starten (Alle Dummy-Tasks leeren und Namen übernehmen)
  const handleResetHouseholdToZero = (
    newHouseholdName: string,
    memberAName: string,
    memberBName: string
  ) => {
    const cleanHouseholdId =
      newHouseholdName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Math.floor(1000 + Math.random() * 9000)

    const freshState: HouseholdState = {
      householdId: cleanHouseholdId,
      householdName: newHouseholdName.trim() || 'Unser Haushalt',
      googleCalendarUrl: '',
      members: [
        {
          id: 'member-a',
          name: memberAName.trim() || 'Person A',
          color: '#6366f1',
          avatar: '🧑‍🚀',
          roleLabel: 'Person A',
        },
        {
          id: 'member-b',
          name: memberBName.trim() || 'Person B',
          color: '#ec4899',
          avatar: '👩‍🚀',
          roleLabel: 'Person B',
        },
      ],
      activeMemberId: 'member-a',
      dishwasher: {
        status: 'empty',
        lastHandledBy: 'member-a',
        updatedAt: new Date().toISOString(),
        xpReward: 15,
      },
      laundry: [
        {
          id: 'hell',
          label: 'Helle Wäsche',
          temperature: '30°/40°',
          iconName: 'Sun',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 20,
        },
        {
          id: 'dunkel',
          label: 'Dunkle Wäsche',
          temperature: '30°/40°',
          iconName: 'Moon',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 20,
        },
        {
          id: 'bunt',
          label: 'Buntwäsche',
          temperature: '30°/40°',
          iconName: 'Palette',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 20,
        },
        {
          id: '60_bettwaesche',
          label: '60° Bettwäsche',
          temperature: '60°',
          iconName: 'BedDouble',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 35,
        },
        {
          id: '60_unterwaesche',
          label: '60° Unterwäsche',
          temperature: '60°',
          iconName: 'Shirt',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 20,
        },
        {
          id: '60_geschirrtuecher',
          label: '60° Geschirrtücher',
          temperature: '60°',
          iconName: 'Sparkles',
          stage: 'idle',
          startedAt: null,
          assignedTo: null,
          xpReward: 20,
        },
      ],
      waste: [],
      chores: [],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          title: `Neuer Haushalt "${newHouseholdName}" gestartet!`,
          category: 'chore',
          completedBy: 'member-a',
          completedByName: memberAName.trim() || 'Person A',
          completedByAvatar: '🧑‍🚀',
          timestamp: new Date().toISOString(),
          xpPoints: 50,
        },
      ],
    }

    localStorage.removeItem(STORAGE_KEY)
    updateStateAndSync(() => freshState)
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

  // Dynamischer Comic-Hintergrund je nach aktivem Tab (wie die Pop-Art Comic Panels)
  const tabBackgroundClass: Record<NavigationTab, string> = {
    dashboard: 'comic-sunburst-amber', // Warmes Pop-Art Gelb / Strahlen (wie Chers & Superman)
    week: 'comic-sunburst-rose',       // Kräftiges Pop-Art Rosa / Strahlen
    laundry: 'comic-sunburst-sky',     // Frisches Comic Hellblau / Strahlen
    waste: 'comic-sunburst-green',     // Pop-Art Mintgrün / Strahlen
    schedule: 'comic-sunburst-teal',   // Vintage Retro Türkis / Strahlen (wie Sugar Taste Panel)
  }

  return (
    <div
      className={`min-h-dvh transition-colors duration-300 ${tabBackgroundClass[activeTab]} text-slate-900 comic-halftone-dots`}
    >
      {/* Mobile-First Container (390px Viewport) */}
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-4 pb-28 pt-safe">
        {/* Vintage Comic Header */}
        <header className="sticky top-0 z-30 -mx-4 mb-4 border-b-3 border-black bg-white/95 px-4 py-3 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col gap-2.5">
            {/* Obere Leiste: Apollo 3000 + Haushaltsname & Einloggen-Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-black bg-amber-400 comic-shadow-sm">
                  <img
                    src={maidIcon}
                    alt="Apollo 3000 Comic Putzfrau"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-comic text-2xl tracking-wider text-slate-900 leading-none">
                    APOLLO 3000
                  </h1>
                  <span className="font-comic text-xs uppercase text-slate-600">
                    {state.householdName}
                  </span>
                </div>
              </div>

              {/* Einloggen-Button */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-rose-500 px-3 py-1.5 font-comic text-xs uppercase text-white comic-shadow-sm transition hover:bg-rose-600 active:translate-y-0.5 font-bold"
              >
                <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Einloggen</span>
              </button>
            </div>

            {/* Untere Leiste: Name und Icons der Personen (Klick öffnet Wochenübersicht dieser Person) */}
            <div className="flex items-center gap-2 rounded-2xl border-2 border-black bg-amber-50 p-1.5 comic-shadow-sm">
              {state.members.map((member) => {
                const isSelected = member.id === activeMember.id
                const openCount = state.chores.filter(
                  (c) => c.assignedTo === member.id
                ).length

                return (
                  <button
                    key={member.id}
                    type="button"
                    title={`${member.name}s Aufgaben & Erledigungen ansehen`}
                    onClick={() => {
                      handleSelectMember(member.id)
                      setInspectingMember(member)
                    }}
                    className={`flex flex-1 items-center justify-between gap-1.5 rounded-xl px-2.5 py-1.5 transition ${
                      isSelected
                        ? 'border border-black bg-amber-400 text-black comic-shadow-sm font-bold'
                        : 'bg-white/80 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg">{member.avatar}</span>
                      <span className="font-comic text-xs uppercase tracking-wide truncate">
                        {member.name}
                      </span>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.2 font-comic text-[10px] ${
                        isSelected
                          ? 'bg-black text-amber-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {openCount} Tasks
                    </span>
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
              <section className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-comic text-lg uppercase tracking-wide text-slate-900">
                      Wochen-Dashboard
                    </h2>
                    <p className="text-xs text-slate-600">
                      {state.activityLog.length} Erledigungen diese Woche
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('week')}
                    className="rounded-2xl border-2 border-black bg-amber-400 px-3.5 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300 font-bold"
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
              onOpenSettings={() => setIsChoreSettingsOpen(true)}
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
              <div className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
                <span className="font-comic text-xs uppercase tracking-wider text-emerald-600">
                  MÜLL-MISSIONEN
                </span>
                <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900 leading-tight">
                  5 Fraktionen
                </h2>
                <p className="text-xs text-slate-600">
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
                    className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border-2 border-black"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <h3 className="font-comic text-xl uppercase tracking-wide text-slate-900">
                            {item.label}
                          </h3>
                          <p className="text-xs text-slate-600">{item.notes}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t-2 border-slate-100 pt-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" />
                        <span>
                          Abholung: <strong>{item.nextPickupDate}</strong>
                        </span>
                        {assignee && (
                          <span className="text-slate-500">
                            · {assignee.avatar} {assignee.name}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkWastePutOut(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-emerald-300 font-bold"
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
              <div className="rounded-3xl border-3 border-black bg-white p-4 comic-shadow">
                <span className="font-comic text-xs uppercase tracking-wider text-rose-600">
                  TEAM-FAIRNESS
                </span>
                <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900 leading-tight">
                  A/B-Rotation
                </h2>
                <p className="text-xs text-slate-600">
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
                        className="rounded-2xl border-2 border-black bg-amber-50 p-3 comic-shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{m.avatar}</span>
                          <div>
                            <div className="font-comic text-base text-slate-900">
                              {m.name}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-500">
                              {m.roleLabel}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-700">
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

              <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-white px-4 py-3 text-xs text-slate-600 comic-shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Demo-Zustand zurücksetzen</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="inline-flex items-center gap-1 rounded-xl border border-black bg-amber-400 px-2.5 py-1 font-comic text-xs uppercase text-black font-bold"
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
        onSaveCalendarUrl={handleSaveCalendarUrl}
        onResetHouseholdToZero={handleResetHouseholdToZero}
      />

      {/* Chore & XP Settings Modal */}
      <ChoreSettingsModal
        isOpen={isChoreSettingsOpen}
        onClose={() => setIsChoreSettingsOpen(false)}
        householdState={state}
        onSaveChore={handleSaveChore}
        onDeleteChore={handleDeleteChore}
      />

      {/* Person Detail & Weekly Progress Modal */}
      {inspectingMember && (
        <PersonDetailModal
          isOpen={Boolean(inspectingMember)}
          onClose={() => setInspectingMember(null)}
          member={inspectingMember}
          state={state}
          onCompleteChore={handleCompleteChore}
        />
      )}

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
