import type { HouseholdState } from '../types/household'

// Helper for dynamic dates relative to today so the mock data is always fresh & realistic
const getRelativeDateISO = (offsetDays: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getRelativeTimestampISO = (offsetHours: number): string => {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000)
  return d.toISOString()
}

export const INITIAL_HOUSEHOLD_STATE: HouseholdState = {
  members: [
    {
      id: 'member-a',
      name: 'Maddin',
      color: '#6366f1', // Indigo
      avatar: '🧑‍🚀',
      roleLabel: 'Person A',
    },
    {
      id: 'member-b',
      name: 'Alex',
      color: '#ec4899', // Pink
      avatar: '👩‍🚀',
      roleLabel: 'Person B',
    },
  ],
  activeMemberId: 'member-a',

  dishwasher: {
    status: 'needs_unloading',
    lastHandledBy: 'member-b',
    updatedAt: getRelativeTimestampISO(-2),
  },

  laundry: [
    {
      id: 'hell',
      label: 'Helle Wäsche',
      temperature: '30°/40°',
      iconName: 'Sun',
      stage: 'hanging',
      startedAt: getRelativeTimestampISO(-5),
      assignedTo: 'member-a',
    },
    {
      id: 'dunkel',
      label: 'Dunkle Wäsche',
      temperature: '30°/40°',
      iconName: 'Moon',
      stage: 'washing',
      startedAt: getRelativeTimestampISO(-1),
      assignedTo: 'member-b',
    },
    {
      id: 'bunt',
      label: 'Buntwäsche',
      temperature: '30°/40°',
      iconName: 'Palette',
      stage: 'idle',
      startedAt: null,
      assignedTo: null,
    },
    {
      id: '60_bettwaesche',
      label: '60° Bettwäsche',
      temperature: '60°',
      iconName: 'BedDouble',
      stage: 'folding',
      startedAt: getRelativeTimestampISO(-18),
      assignedTo: 'member-a',
    },
    {
      id: '60_unterwaesche',
      label: '60° Unterwäsche',
      temperature: '60°',
      iconName: 'Shirt',
      stage: 'idle',
      startedAt: null,
      assignedTo: null,
    },
    {
      id: '60_geschirrtuecher',
      label: '60° Geschirrtücher',
      temperature: '60°',
      iconName: 'Sparkles',
      stage: 'done',
      startedAt: getRelativeTimestampISO(-26),
      assignedTo: 'member-b',
    },
  ],

  waste: [
    {
      id: 'bio',
      label: 'Biomüll',
      color: '#22c55e', // Green
      nextPickupDate: getRelativeDateISO(1), // Tomorrow -> triggers evening-before alert!
      reminderEveningBefore: true,
      assignedTo: 'member-a',
      notes: 'Braune Tonne an die Straße stellen',
    },
    {
      id: 'gelber_sack',
      label: 'Gelber Sack',
      color: '#eab308', // Yellow
      nextPickupDate: getRelativeDateISO(1), // Tomorrow -> triggers evening-before alert!
      reminderEveningBefore: true,
      assignedTo: 'member-b',
      notes: 'Im Keller gebündelt bereitstellen',
    },
    {
      id: 'restmuell',
      label: 'Restmüll',
      color: '#64748b', // Slate
      nextPickupDate: getRelativeDateISO(4),
      reminderEveningBefore: true,
      assignedTo: 'member-a',
      notes: 'Schwarze Tonne (2-wöchentlich)',
    },
    {
      id: 'pappe',
      label: 'Pappe & Papier',
      color: '#3b82f6', // Blue
      nextPickupDate: getRelativeDateISO(8),
      reminderEveningBefore: true,
      assignedTo: 'member-b',
      notes: 'Kartons vorher klein falten',
    },
    {
      id: 'altglas',
      label: 'Altglas',
      color: '#14b8a6', // Teal
      nextPickupDate: getRelativeDateISO(3),
      reminderEveningBefore: false,
      assignedTo: 'member-a',
      notes: 'Glascontainer am Supermarkt (Weiß/Grün/Braun)',
    },
  ],

  chores: [
    {
      id: 'klo_reinigen',
      title: 'Klo reinigen',
      description: 'WC, Waschbecken & Spiegel gründlich putzen',
      intervalDays: 7,
      lastCompletedAt: getRelativeDateISO(-7), // Due today!
      assignedTo: 'member-a',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 20,
    },
    {
      id: 'saugen_nass_wischen',
      title: 'Saugen & nass wischen',
      description: 'Alle Wohnräume saugen und Hartböden feucht wischen',
      intervalDays: 7,
      lastCompletedAt: getRelativeDateISO(-8), // 1 day overdue -> Due today!
      assignedTo: 'member-b',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 45,
    },
    {
      id: 'fenster_putzen',
      title: 'Fenster putzen',
      description: 'Wohnzimmer-, Schlafzimmer- und Küchenfenster streifenfrei reinigen',
      intervalDays: 30,
      lastCompletedAt: getRelativeDateISO(-26), // Due in 4 days
      assignedTo: 'member-a',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 60,
    },
  ],
}
