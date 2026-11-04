import { useState } from 'react'
import {
  Check,
  Copy,
  DoorOpen,
  ExternalLink,
  LogIn,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { isFirebaseConfigured, loginWithGoogle } from '../../config/firebase'
import type { HouseholdMember, HouseholdState } from '../../types/household'

interface HouseholdAuthModalProps {
  isOpen: boolean
  onClose: () => void
  householdState: HouseholdState
  activeMember: HouseholdMember
  onUpdateHouseholdId: (newHouseholdId: string) => void
  onGoogleUserConnected: (user: { name: string; email: string; avatar: string }) => void
  onSaveCalendarUrl: (calendarUrl: string) => void
  onResetHouseholdToZero: (newHouseholdName: string, memberAName: string, memberBName: string) => void
}

export function HouseholdAuthModal({
  isOpen,
  onClose,
  householdState,
  activeMember,
  onUpdateHouseholdId,
  onGoogleUserConnected,
  onSaveCalendarUrl,
  onResetHouseholdToZero,
}: HouseholdAuthModalProps) {
  const [inputHouseholdCode, setInputHouseholdCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Google Kalender
  const [calendarUrl, setCalendarUrl] = useState(householdState.googleCalendarUrl || '')
  const [calendarSaved, setCalendarSaved] = useState(false)

  // Bei Null starten Dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetName, setResetName] = useState('Unser Zuhause')
  const [resetPersonA, setResetPersonA] = useState(householdState.members[0]?.name || 'Person A')
  const [resetPersonB, setResetPersonB] = useState(householdState.members[1]?.name || 'Person B')

  if (!isOpen) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(householdState.householdId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinHousehold = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputHouseholdCode.trim()) return
    onUpdateHouseholdId(inputHouseholdCode.trim().toLowerCase())
    onClose()
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg(null)
    setIsLoading(true)

    if (!isFirebaseConfigured) {
      setTimeout(() => {
        onGoogleUserConnected({
          name: activeMember.name,
          email: `${activeMember.name.toLowerCase()}@gmail.com`,
          avatar: activeMember.avatar,
        })
        setIsLoading(false)
      }, 400)
      return
    }

    try {
      const result = await loginWithGoogle()
      const user = result.user
      onGoogleUserConnected({
        name: user.displayName || 'Google Held',
        email: user.email || '',
        avatar: user.photoURL ? '🦸' : '🧑‍🚀',
      })
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Login fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCalendar = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveCalendarUrl(calendarUrl.trim())
    setCalendarSaved(true)
    setTimeout(() => setCalendarSaved(false), 2000)
  }

  const handleConfirmReset = () => {
    onResetHouseholdToZero(resetName, resetPersonA, resetPersonB)
    setShowResetConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border-3 border-black bg-[#22140b] p-5 text-white comic-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border-2 border-black bg-rose-500 p-1 text-white comic-shadow-sm hover:bg-rose-400"
        >
          <X className="h-4 w-4 stroke-[3]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <Users className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-comic text-xl uppercase tracking-wide text-amber-300">
              Account, Kalender &amp; Haushalt
            </h2>
            <p className="text-xs text-amber-100/70">
              Verwalten, Synchronisieren &amp; Neu starten
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-rose-500 bg-rose-950/60 p-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* 1. Google Account Login */}
        <div className="mt-4 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-amber-400">
            1. GOOGLE LOGIN
          </span>
          <p className="mt-0.5 text-xs text-amber-100/70">
            {activeMember.email
              ? `Eingeloggt als: ${activeMember.email}`
              : 'Verbinde deinen Google-Account für Live-Sync.'}
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white py-2 font-comic text-xs uppercase text-black comic-shadow-sm transition hover:bg-slate-100 active:translate-y-0.5"
          >
            <LogIn className="h-4 w-4 stroke-[2.5]" />
            <span>
              {isLoading
                ? 'Verbinde...'
                : activeMember.email
                  ? `Verbunden: ${activeMember.name}`
                  : `Mit Google einloggen (${activeMember.name})`}
            </span>
          </button>
        </div>

        {/* 2. Google Kalender verbinden */}
        <div className="mt-3 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-comic text-xs uppercase tracking-wide text-amber-400">
              2. GOOGLE KALENDER VERBINDEN
            </span>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-comic text-[11px] uppercase text-amber-300 hover:underline"
            >
              <span>Öffnen</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <p className="mt-1 text-xs text-amber-100/70">
            Hinterlege hier euren gemeinsamen Google-Kalender (E-Mail oder iCal/Webcal-URL für automatische Termine &amp; Müllabfuhr):
          </p>

          <form onSubmit={handleSaveCalendar} className="mt-2.5 flex gap-2">
            <input
              type="text"
              placeholder="z.B. familie.mustermann@gmail.com oder https://..."
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-black bg-[#24130a] px-3 py-1.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-amber-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300 active:translate-y-0.5"
            >
              {calendarSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Gespeichert</span>
                </>
              ) : (
                <span>Speichern</span>
              )}
            </button>
          </form>
        </div>

        {/* 3. Gemeinsamer Haushalts-Code & Teilen */}
        <div className="mt-3 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-amber-400">
            3. HAUSHALT TEILEN (CODE)
          </span>
          <p className="mt-0.5 text-xs text-amber-100/70">
            Diesen Code am 2. Smartphone eingeben um denselben Haushalt zu nutzen:
          </p>

          <div className="mt-2 flex items-center justify-between rounded-xl border-2 border-black bg-[#2d180d] px-3 py-2">
            <span className="font-mono text-xs font-bold text-amber-300">
              {householdState.householdId}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-lg border border-black bg-amber-400 px-2 py-0.5 font-comic text-xs uppercase text-black"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 stroke-[2.5]" />
                  <span>Kopieren</span>
                </>
              )}
            </button>
          </div>

          {/* Einem anderen Haushalt beitreten */}
          <form onSubmit={handleJoinHousehold} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Anderen Code eingeben..."
              value={inputHouseholdCode}
              onChange={(e) => setInputHouseholdCode(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-black bg-[#24130a] px-3 py-1.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm active:translate-y-0.5"
            >
              <DoorOpen className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Wechseln</span>
            </button>
          </form>
        </div>

        {/* 4. BEI NULL STARTEN (Reset & Eigene Namen vergeben) */}
        <div className="mt-4 rounded-2xl border-2 border-rose-500/80 bg-[#240c08] p-3.5 comic-shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-comic text-xs uppercase tracking-wide text-rose-400 flex items-center gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              HAUSHALT BEI NULL STARTEN
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-200/80">
            Löscht alle Dummy-Daten und lässt euch Namen, Personen und leere Listen komplett frisch anlegen.
          </p>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-rose-500 py-2 font-comic text-xs uppercase text-white comic-shadow-sm hover:bg-rose-600 active:translate-y-0.5"
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Jetzt bei Null starten</span>
            </button>
          ) : (
            <div className="mt-3 space-y-2.5 rounded-xl border border-black bg-black/40 p-3">
              <div>
                <label className="block font-comic text-[11px] uppercase text-amber-300">
                  Name des Haushalts
                </label>
                <input
                  type="text"
                  value={resetName}
                  onChange={(e) => setResetName(e.target.value)}
                  placeholder="z.B. Villa Kunterbunt"
                  className="mt-1 w-full rounded-xl border border-black bg-[#1e0a06] px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-comic text-[11px] uppercase text-amber-300">
                    Person 1 (Du)
                  </label>
                  <input
                    type="text"
                    value={resetPersonA}
                    onChange={(e) => setResetPersonA(e.target.value)}
                    placeholder="Name 1"
                    className="mt-1 w-full rounded-xl border border-black bg-[#1e0a06] px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block font-comic text-[11px] uppercase text-amber-300">
                    Person 2 (Partner)
                  </label>
                  <input
                    type="text"
                    value={resetPersonB}
                    onChange={(e) => setResetPersonB(e.target.value)}
                    placeholder="Name 2"
                    className="mt-1 w-full rounded-xl border border-black bg-[#1e0a06] px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl border border-black bg-slate-800 py-1.5 font-comic text-xs uppercase text-slate-300"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 rounded-xl border-2 border-black bg-rose-500 py-1.5 font-comic text-xs uppercase text-white font-bold comic-shadow-sm hover:bg-rose-600"
                >
                  Bestätigen &amp; Leeren
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-amber-300/60">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Apollo 3000 synchronisiert in Echtzeit</span>
        </div>
      </div>
    </div>
  )
}
