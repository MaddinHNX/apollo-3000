// ============================================================================
// Apollo 3000 – Household Management Data Model & TypeScript Interfaces
// ============================================================================

export type MemberId = string

/**
 * 1. User / Household Member (2-Person Household)
 */
export interface HouseholdMember {
  id: MemberId
  name: string
  color: string // Hex or Tailwind color token
  avatar: string // Emoji or avatar URL
  roleLabel?: 'Person A' | 'Person B'
}

/**
 * 2. Dishwasher State Machine
 */
export type DishwasherStatus =
  | 'empty'
  | 'loading'
  | 'running'
  | 'needs_unloading'

export interface DishwasherState {
  status: DishwasherStatus
  lastHandledBy: MemberId
  updatedAt: string // ISO 8601 timestamp
}

/**
 * 3. Laundry State Machine (6 Sorten & 5 Stages)
 */
export type LaundryType =
  | 'hell'
  | 'dunkel'
  | 'bunt'
  | '60_bettwaesche'
  | '60_unterwaesche'
  | '60_geschirrtuecher'

export type LaundryStage =
  | 'idle'
  | 'washing'
  | 'hanging'
  | 'folding'
  | 'done'

export interface LaundryItem {
  id: LaundryType
  label: string
  temperature: '30°/40°' | '60°'
  iconName: string
  stage: LaundryStage
  startedAt: string | null // ISO 8601 timestamp when cycle started
  assignedTo: MemberId | null
}

/**
 * 4. Waste Management (5 Fraktionen)
 */
export type WasteType =
  | 'pappe'
  | 'gelber_sack'
  | 'bio'
  | 'restmuell'
  | 'altglas'

export interface WasteScheduleItem {
  id: WasteType
  label: string
  color: string
  nextPickupDate: string // ISO 8601 date (YYYY-MM-DD)
  reminderEveningBefore: boolean
  assignedTo?: MemberId
  notes?: string
}

/**
 * 5. Standard Chores (Wiederkehrende Kernaufgaben mit A/B-Rotation)
 */
export type StandardChoreSlug =
  | 'fenster_putzen'
  | 'saugen_nass_wischen'
  | 'klo_reinigen'

export interface StandardChore {
  id: StandardChoreSlug | string
  title: string // e.g., "Fenster putzen", "Saugen & nass wischen", "Klo reinigen"
  description?: string
  intervalDays: number // e.g. 7, 14, 30
  lastCompletedAt: string // ISO 8601 date/timestamp
  assignedTo: MemberId // Person A or Person B (rotates automatically on completion)
  rotationOrder: [MemberId, MemberId] // [Person A, Person B]
  estimatedMinutes: number
}

/**
 * Navigation Tabs for Mobile Bottom Navigation
 */
export type NavigationTab = 'dashboard' | 'laundry' | 'waste' | 'schedule'

/**
 * Complete Household Store Snapshot
 */
export interface HouseholdState {
  members: HouseholdMember[]
  activeMemberId: MemberId
  dishwasher: DishwasherState
  laundry: LaundryItem[]
  waste: WasteScheduleItem[]
  chores: StandardChore[]
}
