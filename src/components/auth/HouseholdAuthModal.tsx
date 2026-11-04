import { useState } from 'react'
import {
  Check,
  Copy,
  DoorOpen,
  LogIn,
  Sparkles,
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
}

export function HouseholdAuthModal({
  isOpen,
  onClose,
  householdState,
  activeMember,
  onUpdateHouseholdId,
  onGoogleUserConnected,
}: HouseholdAuthModalProps) {
  const [inputHouseholdCode, setInputHouseholdCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      // In Mock-Modus: Simuliere sofortigen Google-Login für flüssiges Testen
      setTimeout(() => {
        onGoogleUserConnected({
          name: activeMember.name,
          email: `${activeMember.name.toLowerCase()}@gmail.com`,
          avatar: activeMember.avatar,
        })
        setIsLoading(false)
        onClose()
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
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Login fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border-3 border-black bg-[#22140b] p-5 text-white comic-shadow">
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
              Haushalt &amp; Google Account
            </h2>
            <p className="text-xs text-amber-100/70">
              Gemeinsam in 1 Haushalt synchronisieren
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-rose-500 bg-rose-950/60 p-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Google Sign-In Section */}
        <div className="mt-4 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-amber-400">
            1. GOOGLE LOGIN
          </span>
          <p className="mt-0.5 text-xs text-amber-100/70">
            Verbinde deinen Google-Account für Google Kalender &amp; Sync.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white py-2 font-comic text-sm uppercase text-black comic-shadow-sm transition hover:bg-slate-100 active:translate-y-0.5"
          >
            <LogIn className="h-4 w-4 stroke-[2.5]" />
            <span>
              {isLoading ? 'Verbinde...' : `Als ${activeMember.name} mit Google einloggen`}
            </span>
          </button>
        </div>

        {/* Share Household Code Section */}
        <div className="mt-3 rounded-2xl border-2 border-black bg-[#160c07] p-3.5 comic-shadow-sm">
          <span className="font-comic text-xs uppercase tracking-wide text-amber-400">
            2. GEMEINSAMER HAUSHALTS-CODE
          </span>
          <p className="mt-0.5 text-xs text-amber-100/70">
            Teile diesen Code mit deiner Partnerperson:
          </p>

          <div className="mt-2.5 flex items-center justify-between rounded-xl border-2 border-black bg-[#2d180d] px-3 py-2">
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
        </div>

        {/* Join Other Household Code */}
        <form onSubmit={handleJoinHousehold} className="mt-3">
          <label
            htmlFor="householdCodeInput"
            className="font-comic text-xs uppercase tracking-wide text-amber-400"
          >
            3. EINEM ANDEREN HAUSHALT BEITRETEN
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="householdCodeInput"
              type="text"
              placeholder="z.B. wg-helden-42"
              value={inputHouseholdCode}
              onChange={(e) => setInputHouseholdCode(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-black bg-[#160c07] px-3 py-1.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border-2 border-black bg-emerald-400 px-3 py-1.5 font-comic text-xs uppercase text-black comic-shadow-sm active:translate-y-0.5"
            >
              <DoorOpen className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Beitreten</span>
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-amber-300/60">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Änderungen synchronisieren sich in Echtzeit</span>
        </div>
      </div>
    </div>
  )
}
