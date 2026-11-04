import {
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Droplets,
  FoldHorizontal,
  Moon,
  Palette,
  RotateCcw,
  Shirt,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react'
import type {
  HouseholdMember,
  LaundryItem,
  LaundryStage,
  LaundryType,
} from '../../types/household'

interface LaundryTrackerProps {
  laundry: LaundryItem[]
  members: HouseholdMember[]
  onAdvanceStage: (laundryId: LaundryType, targetStage?: LaundryStage) => void
}

const PIPELINE_STAGES: {
  id: LaundryStage
  label: string
  shortLabel: string
}[] = [
  { id: 'idle', label: 'Bereit im Korb', shortLabel: 'KORB' },
  { id: 'washing', label: 'Wäscht mit Schaum', shortLabel: 'WÄSCHT' },
  { id: 'hanging', label: 'Hängt an der Leine', shortLabel: 'HÄNGT' },
  { id: 'folding', label: 'Wartet aufs Falten', shortLabel: 'FALTEN' },
  { id: 'done', label: 'Im Schrank verstaut', shortLabel: 'FERTIG' },
]

const STAGE_STYLE: Record<
  LaundryStage,
  {
    badge: string
    buttonBg: string
    buttonLabel: string
  }
> = {
  idle: {
    badge: 'bg-black/60 text-amber-200/60 border-black',
    buttonBg: 'bg-amber-400 text-black',
    buttonLabel: 'Waschen starten!',
  },
  washing: {
    badge: 'bg-sky-400 text-black border-black',
    buttonBg: 'bg-sky-400 text-black',
    buttonLabel: 'Aufhängen!',
  },
  hanging: {
    badge: 'bg-emerald-400 text-black border-black',
    buttonBg: 'bg-emerald-400 text-black',
    buttonLabel: 'Abnehmen & Falten!',
  },
  folding: {
    badge: 'bg-amber-400 text-black border-black',
    buttonBg: 'bg-amber-400 text-black',
    buttonLabel: 'Im Schrank verstaut!',
  },
  done: {
    badge: 'bg-white text-black border-black',
    buttonBg: 'bg-[#2b190f] text-amber-200',
    buttonLabel: 'Zurücksetzen',
  },
}

function getLaundryIcon(iconName: string) {
  switch (iconName) {
    case 'Sun':
      return Sun
    case 'Moon':
      return Moon
    case 'Palette':
      return Palette
    case 'BedDouble':
      return BedDouble
    case 'Sparkles':
      return Sparkles
    default:
      return Shirt
  }
}

export function LaundryTracker({
  laundry,
  members,
  onAdvanceStage,
}: LaundryTrackerProps) {
  const activeLoads = laundry.filter(
    (item) => item.stage !== 'idle' && item.stage !== 'done'
  ).length

  return (
    <div className="space-y-4">
      {/* Vintage Comic Header Card */}
      <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-[#2d170c] p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-comic text-xs uppercase tracking-wider text-amber-400">
              ★ DIE GROSSE WÄSCHE-SCHLACHT ★
            </span>
            <h2 className="font-comic text-2xl uppercase tracking-wide text-white">
              6 Sorten · Pipeline
            </h2>
            <p className="text-xs font-medium text-amber-100/70">
              Wäscht → Hängt → Falten → Schrank!
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="rounded-2xl border-2 border-black bg-rose-500 px-3 py-1 font-comic text-sm uppercase text-white comic-shadow-sm">
              {activeLoads} AKTIV
            </span>
          </div>
        </div>

        {/* Vintage Comic Stage Legend */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border-2 border-black bg-[#160c06] p-2.5 text-center font-comic text-xs uppercase">
          <div className="flex items-center justify-center gap-1.5 text-sky-400">
            <Droplets className="h-4 w-4 stroke-[2.5]" />
            <span>
              Wäscht ({laundry.filter((l) => l.stage === 'washing').length})
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-400">
            <Wind className="h-4 w-4 stroke-[2.5]" />
            <span>
              Hängt ({laundry.filter((l) => l.stage === 'hanging').length})
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-amber-400">
            <FoldHorizontal className="h-4 w-4 stroke-[2.5]" />
            <span>
              Falten ({laundry.filter((l) => l.stage === 'folding').length})
            </span>
          </div>
        </div>
      </div>

      {/* 6 Laundry Cards */}
      <div className="space-y-3">
        {laundry.map((item) => {
          const Icon = getLaundryIcon(item.iconName)
          const style = STAGE_STYLE[item.stage]
          const assignee = members.find((m) => m.id === item.assignedTo)
          const currentStageIdx = PIPELINE_STAGES.findIndex(
            (s) => s.id === item.stage
          )

          return (
            <div
              key={item.id}
              className="rounded-3xl border-3 border-black bg-[#24150b] p-4 comic-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
                    <Icon className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-comic text-lg uppercase tracking-wide text-white">
                        {item.label}
                      </h3>
                      <span className="rounded-md border border-black bg-black px-1.5 py-0.5 font-comic text-xs text-amber-300">
                        {item.temperature}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-amber-100/70">
                      <span>
                        Status:{' '}
                        <strong className="text-white">
                          {PIPELINE_STAGES[currentStageIdx]?.label}
                        </strong>
                      </span>
                      {assignee && (
                        <span>
                          · {assignee.avatar} {assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`rounded-xl border-2 px-2.5 py-1 font-comic text-xs uppercase comic-shadow-sm ${style.badge}`}
                >
                  {PIPELINE_STAGES[currentStageIdx]?.shortLabel}
                </span>
              </div>

              {/* Visual 5-Step Pipeline Bar with bold Comic Outlines */}
              <div className="mt-3.5 grid grid-cols-5 gap-1.5">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const isActive = idx === currentStageIdx
                  const isPassed = idx < currentStageIdx

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => onAdvanceStage(item.id, stage.id)}
                      className="group flex flex-col items-center gap-1 text-center"
                    >
                      <div
                        className={`h-2.5 w-full rounded-full border border-black transition-all ${
                          isActive
                            ? 'bg-amber-400 ring-2 ring-black'
                            : isPassed
                              ? 'bg-amber-600'
                              : 'bg-[#140b06]'
                        }`}
                      />
                      <span
                        className={`font-comic text-[11px] ${
                          isActive
                            ? 'font-bold text-amber-300 scale-105'
                            : isPassed
                              ? 'text-amber-100/60'
                              : 'text-amber-200/30'
                        }`}
                      >
                        {stage.shortLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Action Button */}
              <div className="mt-3.5 flex items-center justify-end border-t-2 border-black/80 pt-3">
                <button
                  type="button"
                  onClick={() => onAdvanceStage(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl border-2 border-black px-4 py-1.5 font-comic text-xs uppercase tracking-wider comic-shadow-sm transition active:translate-x-0.5 active:translate-y-0.5 ${style.buttonBg}`}
                >
                  {item.stage === 'done' ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{style.buttonLabel}</span>
                    </>
                  ) : item.stage === 'folding' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{style.buttonLabel}</span>
                    </>
                  ) : (
                    <>
                      <span>{style.buttonLabel}</span>
                      <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
