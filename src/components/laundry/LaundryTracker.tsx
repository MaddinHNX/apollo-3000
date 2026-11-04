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
  { id: 'idle', label: 'Korb / Bereit', shortLabel: 'Bereit' },
  { id: 'washing', label: 'Wäscht', shortLabel: 'Wäscht' },
  { id: 'hanging', label: 'Hängt / Trocknet', shortLabel: 'Hängt' },
  { id: 'folding', label: 'Falten', shortLabel: 'Falten' },
  { id: 'done', label: 'Im Schrank', shortLabel: 'Fertig' },
]

const STAGE_STYLE: Record<
  LaundryStage,
  {
    badge: string
    border: string
    buttonLabel: string
  }
> = {
  idle: {
    badge: 'bg-slate-800 text-slate-400',
    border: 'border-slate-800/80 bg-slate-900/50',
    buttonLabel: 'Waschgang starten',
  },
  washing: {
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    border: 'border-sky-500/40 bg-sky-950/15',
    buttonLabel: 'Aufhängen',
  },
  hanging: {
    badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    border: 'border-teal-500/40 bg-teal-950/15',
    buttonLabel: 'Abnehmen & Falten',
  },
  folding: {
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    border: 'border-amber-500/40 bg-amber-950/15',
    buttonLabel: 'Verstaut!',
  },
  done: {
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    border: 'border-emerald-500/30 bg-emerald-950/10',
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
      {/* Summary Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Wäsche-Pipeline
            </span>
            <h2 className="mt-0.5 text-lg font-bold text-slate-100">
              6 Sorten · State Machine
            </h2>
            <p className="text-xs text-slate-400">
              Wäscht → Hängt → Falten → Im Schrank
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="rounded-2xl bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              {activeLoads} aktiv
            </span>
          </div>
        </div>

        {/* Visual Pipeline Legend */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-2.5 text-center text-[11px]">
          <div className="flex items-center justify-center gap-1.5 text-sky-300">
            <Droplets className="h-3.5 w-3.5" />
            <span>
              Wäscht ({laundry.filter((l) => l.stage === 'washing').length})
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-teal-300">
            <Wind className="h-3.5 w-3.5" />
            <span>
              Hängt ({laundry.filter((l) => l.stage === 'hanging').length})
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-amber-300">
            <FoldHorizontal className="h-3.5 w-3.5" />
            <span>
              Falten ({laundry.filter((l) => l.stage === 'folding').length})
            </span>
          </div>
        </div>
      </div>

      {/* 6 Laundry Sort Cards */}
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
              className={`rounded-3xl border p-4 transition-all duration-200 ${style.border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800/90 text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">
                        {item.label}
                      </h3>
                      <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                        {item.temperature}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>
                        Status:{' '}
                        <strong className="text-slate-200">
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
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
                >
                  {PIPELINE_STAGES[currentStageIdx]?.shortLabel}
                </span>
              </div>

              {/* Visual 5-Step Pipeline Bar */}
              <div className="mt-3.5 grid grid-cols-5 gap-1">
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
                        className={`h-1.5 w-full rounded-full transition-all ${
                          isActive
                            ? 'bg-indigo-400'
                            : isPassed
                              ? 'bg-indigo-500/45'
                              : 'bg-slate-800'
                        }`}
                      />
                      <span
                        className={`text-[10px] ${
                          isActive
                            ? 'font-bold text-indigo-300'
                            : isPassed
                              ? 'text-slate-400'
                              : 'text-slate-600'
                        }`}
                      >
                        {stage.shortLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Action Footer */}
              <div className="mt-3 flex items-center justify-end border-t border-slate-800/60 pt-2.5">
                <button
                  type="button"
                  onClick={() => onAdvanceStage(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    item.stage === 'done'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-400'
                  }`}
                >
                  {item.stage === 'done' ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{style.buttonLabel}</span>
                    </>
                  ) : item.stage === 'folding' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{style.buttonLabel}</span>
                    </>
                  ) : (
                    <>
                      <span>{style.buttonLabel}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
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
