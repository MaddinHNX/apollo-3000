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
    badgeBorder: string
    bubbleBg: string
    icon: typeof Sparkles
    spin?: boolean
  }
> = {
  empty: {
    comicSpeechBubble: 'CLEAN!',
    title: 'Leer & Glänzend!',
    subline: 'Perfekt ausgeräumt – bereit für neues Geschirr',
    nextActionLabel: 'Beladen starten',
    badgeBg: 'bg-emerald-400 text-black',
    badgeBorder: 'border-black',
    bubbleBg: 'bg-[#22c55e] text-black',
    icon: CheckCircle2,
  },
  loading: {
    comicSpeechBubble: 'FEED ME!',
    title: 'Wird eingeräumt',
    subline: 'Schmutziges Geschirr direkt hinein!',
    nextActionLabel: 'Maschine starten',
    badgeBg: 'bg-amber-300 text-black',
    badgeBorder: 'border-black',
    bubbleBg: 'bg-[#facc15] text-black',
    icon: Utensils,
  },
  running: {
    comicSpeechBubble: 'WASHING!',
    title: 'Spült mit Volldampf!',
    subline: 'Eco 50° läuft – bitte geschlossen halten',
    nextActionLabel: 'Als fertig markieren',
    badgeBg: 'bg-sky-400 text-black',
    badgeBorder: 'border-black',
    bubbleBg: 'bg-[#38bdf8] text-black',
    icon: Zap,
    spin: true,
  },
  needs_unloading: {
    comicSpeechBubble: 'DONE! UNLOAD!',
    title: 'Fertig – Ausräumen!',
    subline: 'Alles blitzblank und wartet auf dich',
    nextActionLabel: 'Ausgeräumt!',
    badgeBg: 'bg-rose-500 text-white',
    badgeBorder: 'border-black',
    bubbleBg: 'bg-[#ef4444] text-white',
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
      className="relative overflow-hidden rounded-3xl border-3 border-black bg-[#24170d] p-4 comic-shadow"
    >
      {/* Halftone / Comic Banner Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-3 border-black ${meta.badgeBg} comic-shadow-sm`}
          >
            <Icon className={`h-7 w-7 stroke-[2.5] ${meta.spin ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-comic text-xs uppercase tracking-wider text-amber-400">
                ★ SPÜLMASCHINE 3000 ★
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/70">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(dishwasher.updatedAt)}
              </span>
            </div>
            <h2 className="font-comic text-2xl tracking-wide text-[#fffdf5]">
              {meta.title}
            </h2>
            <p className="text-xs font-medium text-amber-100/70">{meta.subline}</p>
          </div>
        </div>

        {/* Vintage Pop-Art Speech Bubble */}
        <div
          className={`hidden sm:flex -rotate-3 rounded-2xl border-3 border-black px-3 py-1 font-comic text-sm font-bold uppercase comic-shadow-sm ${meta.bubbleBg}`}
        >
          {meta.comicSpeechBubble}
        </div>
      </div>

      {/* Stepper Buttons mit Comic-Outlines */}
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
                  : 'border-black/60 bg-[#160d07] text-amber-200/60 hover:bg-[#2b1b10] hover:text-amber-100'
              }`}
            >
              {stepLabels[step]}
            </button>
          )
        })}
      </div>

      {/* 1-Tap Big Comic Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t-2 border-black/80 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200/80">
          <Disc className="h-3.5 w-3.5 text-amber-400" />
          <span>Zuletzt:</span>
          {handler ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-black bg-black/40 px-1.5 py-0.5 text-white">
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
          className="inline-flex items-center gap-2 rounded-2xl border-3 border-black bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 font-comic text-sm uppercase tracking-wider text-black comic-shadow-sm transition hover:from-amber-300 hover:to-amber-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <RotateCw className="h-4 w-4 stroke-[3]" />
          <span>{meta.nextActionLabel}</span>
        </button>
      </div>
    </section>
  )
}
