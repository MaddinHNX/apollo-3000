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
  email?: string
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
  xpReward: number // Default 15 XP
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
  xpReward: number // Default 20 XP
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
  xpReward: number // Default 25 XP
}

/**
 * 5. Kitchen Chores / Küche Todos
 */
export interface KitchenChore {
  id: string
  title: string
  description?: string
  intervalDays: number
  lastCompletedAt: string
  assignedTo: MemberId
  rotationOrder: [MemberId, MemberId]
  estimatedMinutes: number
  xpReward: number
}

/**
 * 6. Standard Chores (Wiederkehrende Aufgaben mit individuellen XP)
 */
export interface StandardChore {
  id: string
  title: string
  description?: string
  intervalDays: number
  lastCompletedAt: string // ISO 8601 date/timestamp
  assignedTo: MemberId // Person A or Person B (rotates automatically on completion)
  rotationOrder: [MemberId, MemberId] // [Person A, Person B]
  estimatedMinutes: number
  xpReward: number // Individuelle XP-Belohnung (z.B. 10 - 100 XP)
}

/**
 * 7. Task Activity History (Wer hat wann was gemacht)
 */
export interface TaskActivityLog {
  id: string
  choreId?: string
  title: string
  category: 'chore' | 'dishwasher' | 'laundry' | 'waste' | 'kitchen'
  completedBy: MemberId
  completedByName: string
  completedByAvatar: string
  timestamp: string // ISO 8601
  xpPoints: number
}

/**
 * Navigation Tabs for Mobile Bottom Navigation
 */
export type NavigationTab = 'dashboard' | 'kitchen' | 'week' | 'laundry' | 'waste' | 'schedule'

/**
 * Complete Household Store Snapshot
 */
export interface HouseholdState {
  householdId: string
  householdName: string
  googleCalendarUrl?: string // Optionaler Webcal/.ics Link oder Kalender-ID
  members: HouseholdMember[]
  activeMemberId: MemberId
  dishwasher: DishwasherState
  kitchenChores: KitchenChore[]
  laundry: LaundryItem[]
  waste: WasteScheduleItem[]
  chores: StandardChore[]
  activityLog: TaskActivityLog[]
}
