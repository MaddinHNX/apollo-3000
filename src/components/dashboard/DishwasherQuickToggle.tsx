import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Disc,
  RotateCw,
  Sparkles,
  Utensils,
  Zap,
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
    comicSpeechBubble: string
    title: string
    subline: string
    nextActionLabel: string
    badgeBg: string
    bubbleBg: string
    cardBg: string
    icon: typeof Sparkles
    spin?: boolean
  }
> = {
  empty: {
    comicSpeechBubble: 'CLEAN!',
    title: 'Blitzblank & Leer!',
    subline: 'Ausgeräumt – bereit für neues Geschirr',
    nextActionLabel: 'Beladen starten',
    badgeBg: 'bg-emerald-400 text-black',
    bubbleBg: 'bg-emerald-300 text-black',
    cardBg: 'bg-white',
    icon: CheckCircle2,
  },
  loading: {
    comicSpeechBubble: 'FEED ME!',
    title: 'Wird eingeräumt',
    subline: 'Schmutziges Geschirr direkt hinein!',
    nextActionLabel: 'Maschine starten',
    badgeBg: 'bg-amber-300 text-black',
    bubbleBg: 'bg-amber-300 text-black',
    cardBg: 'bg-white',
    icon: Utensils,
  },
  running: {
    comicSpeechBubble: 'WASHING!',
    title: 'Spült mit Volldampf!',
    subline: 'Eco-Programm läuft – bitte nicht öffnen',
    nextActionLabel: 'Als fertig markieren',
    badgeBg: 'bg-sky-400 text-black',
    bubbleBg: 'bg-sky-300 text-black',
    cardBg: 'bg-white',
    icon: Zap,
    spin: true,
  },
  needs_unloading: {
    comicSpeechBubble: 'UNLOAD ME!',
    title: 'Fertig – Ausräumen!',
    subline: 'Alles glänzt und wartet auf dich',
    nextActionLabel: 'Ausgeräumt!',
    badgeBg: 'bg-rose-500 text-white',
    bubbleBg: 'bg-rose-400 text-black',
    cardBg: 'bg-rose-50/90',
    icon: AlertTriangle,
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
      className={`relative overflow-hidden rounded-3xl border-3 border-black p-4 comic-shadow ${meta.cardBg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-3 border-black ${meta.badgeBg} comic-shadow-sm`}
          >
            <Icon className={`h-7 w-7 stroke-[2.5] ${meta.spin ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-comic text-xs uppercase tracking-wider text-amber-700">
                ★ SPÜLMASCHINE 3000 ★
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(dishwasher.updatedAt)}
              </span>
            </div>
            <h2 className="font-comic text-2xl tracking-wide text-slate-900 leading-tight">
              {meta.title}
            </h2>
            <p className="text-xs font-medium text-slate-600">{meta.subline}</p>
          </div>
        </div>

        {/* Vintage Pop-Art Speech Bubble */}
        <div
          className={`-rotate-3 rounded-2xl border-3 border-black px-3 py-1 font-comic text-sm font-bold uppercase comic-shadow-sm ${meta.bubbleBg}`}
        >
          {meta.comicSpeechBubble}
        </div>
      </div>

      {/* Stepper Buttons */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {STATUS_ORDER.map((step) => {
          const isCurrent = dishwasher.status === step
          const stepLabels: Record<DishwasherStatus, string> = {
            empty: 'LEER',
            loading: 'REIN',
            running: 'LÄUFT',
            needs_unloading: 'RAUS!',
          }
          return (
            <button
              key={step}
              type="button"
              onClick={() => onCycleStatus(step)}
              className={`rounded-xl border-2 py-1.5 text-center font-comic text-sm tracking-wider transition-all duration-150 active:translate-y-0.5 ${
                isCurrent
                  ? 'border-black bg-amber-400 text-black comic-shadow-sm font-bold -translate-y-0.5'
                  : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-black'
              }`}
            >
              {stepLabels[step]}
            </button>
          )
        })}
      </div>

      {/* 1-Tap Big Comic Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t-2 border-slate-200 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Disc className="h-3.5 w-3.5 text-amber-600" />
          <span>Zuletzt:</span>
          {handler ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-slate-900">
              <span>{handler.avatar}</span>
              <span className="font-bold">{handler.name}</span>
            </span>
          ) : (
            <span>Niemand</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onCycleStatus()}
          className="inline-flex items-center gap-2 rounded-2xl border-3 border-black bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 font-comic text-sm uppercase tracking-wider text-black comic-shadow-sm transition hover:from-amber-300 hover:to-amber-400 active:translate-x-0.5 active:translate-y-0.5"
        >
          <RotateCw className="h-4 w-4 stroke-[3]" />
          <span>{meta.nextActionLabel}</span>
        </button>
      </div>
    </section>
  )
}
