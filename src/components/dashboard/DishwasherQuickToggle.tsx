import {
  CheckCircle2,
  Clock,
   Disc,
  Loader2,
  RotateCw,
  Sparkles,
  Utensils,
} from 'lucide-react'
import type {
  DishwasherState,
  DishwasherStatus,
  HouseholdMember,
} from '../../types/household'

interface DishwasherQuickToggleProps {
  dishwasher: DishwasherState
  members: HouseholdMember[]
  onCycleStatus: (nextStatus?: DishwasherStatus) => void
}

const STATUS_ORDER: DishwasherStatus[] = [
  'empty',
  'loading',
  'running',
  'needs_unloading',
]

const STATUS_META: Record<
  DishwasherStatus,
  {
    label: string
    subline: string
    nextActionLabel: string
    badgeBg: string
    cardBorder: string
    accentText: string
    icon: typeof Sparkles
    spin?: boolean
  }
> = {
  empty: {
    label: 'Leer & bereit',
    subline: 'Sauber ausgeräumt – bereit für neues Geschirr',
    nextActionLabel: 'Beladen starten',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cardBorder: 'border-emerald-500/30 bg-emerald-950/15',
    accentText: 'text-emerald-400',
    icon: CheckCircle2,
  },
  loading: {
    label: 'Wird eingeräumt',
    subline: 'Schmutziges Geschirr darf rein',
    nextActionLabel: 'Maschine starten',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    cardBorder: 'border-sky-500/30 bg-sky-950/15',
    accentText: 'text-sky-400',
    icon: Utensils,
  },
  running: {
    label: 'Spült gerade...',
    subline: 'Eco-Programm läuft – bitte nicht öffnen',
    nextActionLabel: 'Als fertig markieren',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    cardBorder: 'border-indigo-500/40 bg-indigo-950/20',
    accentText: 'text-indigo-400',
    icon: Loader2,
    spin: true,
  },
  needs_unloading: {
    label: 'Fertig – Ausräumen!',
    subline: 'Geschirr ist sauber und wartet aufs Ausräumen',
    nextActionLabel: 'Ausgeräumt!',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cardBorder: 'border-amber-500/40 bg-amber-950/20',
    accentText: 'text-amber-400',
    icon: Sparkles,
  },
}

function formatTimeAgo(isoString: string): string {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000)
  )
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`
  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tg.`
}

export function DishwasherQuickToggle({
  dishwasher,
  members,
  onCycleStatus,
}: DishwasherQuickToggleProps) {
  const meta = STATUS_META[dishwasher.status]
  const Icon = meta.icon
  const handler = members.find((m) => m.id === dishwasher.lastHandledBy)

  return (
    <section
      aria-label="Spülmaschinen-Status"
      className={`rounded-3xl border p-4 transition-all duration-300 ${meta.cardBorder}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.badgeBg}`}
          >
            <Icon className={`h-6 w-6 ${meta.spin ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Spülmaschine
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(dishwasher.updatedAt)}
              </span>
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-slate-100">
              {meta.label}
            </h2>
            <p className="text-xs text-slate-400">{meta.subline}</p>
          </div>
        </div>
      </div>

      {/* Stepper Pills */}
      <div className="mt-3.5 grid grid-cols-4 gap-1.5">
        {STATUS_ORDER.map((step) => {
          const isCurrent = dishwasher.status === step
          const stepShortLabel: Record<DishwasherStatus, string> = {
            empty: 'Leer',
            loading: 'Beladen',
            running: 'Läuft',
            needs_unloading: 'Fertig',
          }
          return (
            <button
              key={step}
              type="button"
              onClick={() => onCycleStatus(step)}
              className={`rounded-xl py-1.5 text-center text-[11px] font-medium transition-all ${
                isCurrent
                  ? 'bg-slate-100 font-semibold text-slate-950 shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {stepShortLabel[step]}
            </button>
          )
        })}
      </div>

      {/* 1-Tap Main Action Footer */}
      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/70 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Disc className="h-3.5 w-3.5 text-slate-500" />
          <span>Zuletzt:</span>
          {handler ? (
            <span className="inline-flex items-center gap-1 font-medium text-slate-200">
              <span>{handler.avatar}</span>
              <span>{handler.name}</span>
            </span>
          ) : (
            <span>Unbekannt</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onCycleStatus()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-400 active:scale-95"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>{meta.nextActionLabel}</span>
        </button>
      </div>
    </section>
  )
}
