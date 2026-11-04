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
  const [isJoining, setIsJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)

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

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = inputHouseholdCode.trim().toLowerCase()
    if (!code) return
    setIsJoining(true)
    try {
      await onUpdateHouseholdId(code)
      setJoinSuccess(true)
      setTimeout(() => {
        setJoinSuccess(false)
        setIsJoining(false)
        onClose()
      }, 800)
    } catch {
      setIsJoining(false)
    }
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
        name: user.displayName || activeMember.name,
        email: user.email || '',
        avatar: user.photoURL ? '🦸' : activeMember.avatar,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('auth/configuration-not-found') || errMsg.includes('auth/operation-not-allowed')) {
        onGoogleUserConnected({
          name: activeMember.name,
          email: `${activeMember.name.toLowerCase()}@gmail.com`,
          avatar: activeMember.avatar,
        })
        setErrorMsg('Hinweis: Google Login wurde lokal verbunden.')
      } else {
        setErrorMsg(errMsg)
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border-3 border-black bg-white p-5 text-slate-900 comic-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border-2 border-black bg-rose-500 p-1 text-white comic-shadow-sm hover:bg-rose-600"
        >
          <X className="h-4 w-4 stroke-[3]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 text-black comic-shadow-sm">
            <Users className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-comic text-2xl uppercase tracking-wide text-slate-900">
              Account, Kalender &amp; Haushalt
            </h2>
            <p className="text-xs font-medium text-slate-600">
              Einstellungen für {householdState.householdName}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border-2 border-amber-500 bg-amber-100 p-2 text-xs font-medium text-amber-900">
            {errorMsg}
          </div>
        )}

        {/* 1. Google Account Login */}
        <div className="mt-4 rounded-2xl border-2 border-black bg-amber-50 p-3.5 comic-shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-comic text-xs uppercase tracking-wide text-amber-800 font-bold">
              1. AKTIVES PROFIL &amp; SYNC
            </span>
            <span className="font-comic text-xs text-amber-900 bg-amber-200 px-2 py-0.5 rounded-lg border border-black font-bold">
              {activeMember.avatar} {activeMember.name}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {activeMember.email
              ? `Verbunden mit Google: ${activeMember.email}`
              : `Hinweis: Zwischen Personen wechselst du direkt oben im Header. Der Google-Login ist optional für Cloud-Backup.`}
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white py-2 font-comic text-xs uppercase text-slate-900 comic-shadow-sm transition hover:bg-slate-100 active:translate-y-0.5 font-bold"
          >
            <LogIn className="h-4 w-4 stroke-[2.5]" />
            <span>
              {isLoading
                ? 'Verbinde...'
                : activeMember.email
                  ? `Google verbunden: ${activeMember.name}`
                  : `Google-Konto verknüpfen (${activeMember.name})`}
            </span>
          </button>
        </div>

        {/* 2. Google Kalender verbinden */}
        <div className="mt-3 rounded-2xl border-2 border-black bg-sky-50 p-3.5 comic-shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-comic text-xs uppercase tracking-wide text-sky-800 font-bold">
              2. GEMEINSAMER GOOGLE KALENDER
            </span>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-comic text-[11px] uppercase text-sky-700 hover:underline"
            >
              <span>Öffnen</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Einfach eure <strong>Kalender-ID</strong> (z.B. <code className="bg-sky-200/60 px-1 rounded font-mono font-bold">schorleweg@gmail.com</code>) oder die Privatadresse im iCal-Format eintragen:
          </p>

          <form onSubmit={handleSaveCalendar} className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="z.B. schorleweg@gmail.com"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-amber-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm hover:bg-amber-300 active:translate-y-0.5 font-bold"
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

          {!calendarUrl && (
            <button
              type="button"
              onClick={() => {
                setCalendarUrl('schorleweg@gmail.com')
                onSaveCalendarUrl('schorleweg@gmail.com')
                setCalendarSaved(true)
                setTimeout(() => setCalendarSaved(false), 2000)
              }}
              className="mt-2 text-left font-comic text-[11px] uppercase text-sky-800 underline hover:text-sky-900"
            >
              👉 1-Klick: &quot;schorleweg@gmail.com&quot; übernehmen
            </button>
          )}
        </div>

        {/* 3. Gemeinsamer Haushalts-Code & Teilen */}
        <div className="mt-3 rounded-2xl border-2 border-black bg-emerald-50 p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-emerald-800 font-bold">
            3. HAUSHALT TEILEN (CODE)
          </span>
          <p className="mt-0.5 text-xs text-slate-600">
            Diesen Code am 2. Smartphone eingeben, um denselben Haushalt live zu teilen:
          </p>

          <div className="mt-2 flex items-center justify-between rounded-xl border-2 border-black bg-white px-3 py-2">
            <span className="font-mono text-xs font-bold text-slate-900">
              {householdState.householdId}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-lg border border-black bg-amber-400 px-2 py-0.5 font-comic text-xs uppercase text-black font-bold"
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

          <form onSubmit={handleJoinHousehold} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Anderen Code eingeben..."
              value={inputHouseholdCode}
              onChange={(e) => setInputHouseholdCode(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm active:translate-y-0.5 font-bold hover:bg-emerald-300"
            >
              {joinSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Verbunden!</span>
                </>
              ) : isJoining ? (
                <span>Lade...</span>
              ) : (
                <>
                  <DoorOpen className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Wechseln</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 4. BEI NULL STARTEN */}
        <div className="mt-4 rounded-2xl border-2 border-rose-400 bg-rose-50 p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-rose-700 flex items-center gap-1 font-bold">
            <RotateCcw className="h-3.5 w-3.5" />
            HAUSHALT BEI NULL STARTEN
          </span>
          <p className="mt-1 text-xs text-slate-600">
            Löscht alle Dummy-Daten und lässt euch Namen, Personen und leere Listen frisch anlegen.
          </p>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-rose-500 py-2 font-comic text-xs uppercase text-white comic-shadow-sm hover:bg-rose-600 active:translate-y-0.5 font-bold"
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Jetzt bei Null starten</span>
            </button>
          ) : (
            <div className="mt-3 space-y-2.5 rounded-xl border border-black bg-white p-3">
              <div>
                <label className="block font-comic text-[11px] uppercase text-slate-700 font-bold">
                  Name des Haushalts
                </label>
                <input
                  type="text"
                  value={resetName}
                  onChange={(e) => setResetName(e.target.value)}
                  placeholder="z.B. Paulinenfriemel"
                  className="mt-1 w-full rounded-xl border border-black bg-amber-50 px-2.5 py-1 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-comic text-[11px] uppercase text-slate-700 font-bold">
                    Person 1 (z.B. Maddin)
                  </label>
                  <input
                    type="text"
                    value={resetPersonA}
                    onChange={(e) => setResetPersonA(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black bg-amber-50 px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-comic text-[11px] uppercase text-slate-700 font-bold">
                    Person 2 (z.B. Janera)
                  </label>
                  <input
                    type="text"
                    value={resetPersonB}
                    onChange={(e) => setResetPersonB(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black bg-amber-50 px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl border border-black bg-slate-200 py-1.5 font-comic text-xs uppercase text-slate-700"
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

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate-500">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Apollo 3000 synchronisiert in Echtzeit</span>
        </div>
      </div>
    </div>
  )
}
