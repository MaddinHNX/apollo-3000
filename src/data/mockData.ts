import type { HouseholdState } from '../types/household'

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
  householdId: 'apollo-home-1',
  householdName: 'Hauptquartier 3000',
  members: [
    {
      id: 'member-a',
      name: 'Maddin',
      color: '#6366f1',
      avatar: '🧑‍🚀',
      email: 'maddin@apollo.local',
      roleLabel: 'Person A',
    },
    {
      id: 'member-b',
      name: 'Alex',
      color: '#ec4899',
      avatar: '👩‍🚀',
      email: 'alex@apollo.local',
      roleLabel: 'Person B',
    },
  ],
  activeMemberId: 'member-a',

  dishwasher: {
    status: 'needs_unloading',
    lastHandledBy: 'member-b',
    updatedAt: getRelativeTimestampISO(-2),
    xpReward: 15,
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
      xpReward: 20,
    },
    {
      id: 'dunkel',
      label: 'Dunkle Wäsche',
      temperature: '30°/40°',
      iconName: 'Moon',
      stage: 'washing',
      startedAt: getRelativeTimestampISO(-1),
      assignedTo: 'member-b',
      xpReward: 20,
    },
    {
      id: 'bunt',
      label: 'Buntwäsche',
      temperature: '30°/40°',
      iconName: 'Palette',
      stage: 'idle',
      startedAt: null,
      assignedTo: null,
      xpReward: 20,
    },
    {
      id: '60_bettwaesche',
      label: '60° Bettwäsche',
      temperature: '60°',
      iconName: 'BedDouble',
      stage: 'folding',
      startedAt: getRelativeTimestampISO(-18),
      assignedTo: 'member-a',
      xpReward: 35,
    },
    {
      id: '60_unterwaesche',
      label: '60° Unterwäsche',
      temperature: '60°',
      iconName: 'Shirt',
      stage: 'idle',
      startedAt: null,
      assignedTo: null,
      xpReward: 20,
    },
    {
      id: '60_geschirrtuecher',
      label: '60° Geschirrtücher',
      temperature: '60°',
      iconName: 'Sparkles',
      stage: 'done',
      startedAt: getRelativeTimestampISO(-26),
      assignedTo: 'member-b',
      xpReward: 20,
    },
  ],

  waste: [
    {
      id: 'bio',
      label: 'Biomüll',
      color: '#22c55e',
      nextPickupDate: getRelativeDateISO(1),
      reminderEveningBefore: true,
      assignedTo: 'member-a',
      notes: 'Braune Tonne an die Straße stellen',
      xpReward: 25,
    },
    {
      id: 'gelber_sack',
      label: 'Gelber Sack',
      color: '#eab308',
      nextPickupDate: getRelativeDateISO(1),
      reminderEveningBefore: true,
      assignedTo: 'member-b',
      notes: 'Im Keller gebündelt bereitstellen',
      xpReward: 25,
    },
    {
      id: 'restmuell',
      label: 'Restmüll',
      color: '#64748b',
      nextPickupDate: getRelativeDateISO(4),
      reminderEveningBefore: true,
      assignedTo: 'member-a',
      notes: 'Schwarze Tonne (2-wöchentlich)',
      xpReward: 25,
    },
    {
      id: 'pappe',
      label: 'Pappe & Papier',
      color: '#3b82f6',
      nextPickupDate: getRelativeDateISO(8),
      reminderEveningBefore: true,
      assignedTo: 'member-b',
      notes: 'Kartons vorher klein falten',
      xpReward: 25,
    },
    {
      id: 'altglas',
      label: 'Altglas',
      color: '#14b8a6',
      nextPickupDate: getRelativeDateISO(3),
      reminderEveningBefore: false,
      assignedTo: 'member-a',
      notes: 'Glascontainer am Supermarkt (Weiß/Grün/Braun)',
      xpReward: 30,
    },
  ],

  chores: [
    {
      id: 'klo_reinigen',
      title: 'Klo reinigen',
      description: 'WC, Waschbecken & Spiegel gründlich putzen',
      intervalDays: 7,
      lastCompletedAt: getRelativeDateISO(-7),
      assignedTo: 'member-a',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 20,
      xpReward: 40,
    },
    {
      id: 'saugen_nass_wischen',
      title: 'Saugen & nass wischen',
      description: 'Alle Wohnräume saugen und Hartböden feucht wischen',
      intervalDays: 7,
      lastCompletedAt: getRelativeDateISO(-8),
      assignedTo: 'member-b',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 45,
      xpReward: 50,
    },
    {
      id: 'fenster_putzen',
      title: 'Fenster putzen',
      description: 'Wohnzimmer-, Schlafzimmer- und Küchenfenster streifenfrei reinigen',
      intervalDays: 30,
      lastCompletedAt: getRelativeDateISO(-26),
      assignedTo: 'member-a',
      rotationOrder: ['member-a', 'member-b'],
      estimatedMinutes: 60,
      xpReward: 70,
    },
  ],

  activityLog: [
    {
      id: 'log-1',
      title: 'Spülmaschine ausgeräumt',
      category: 'dishwasher',
      completedBy: 'member-b',
      completedByName: 'Alex',
      completedByAvatar: '👩‍🚀',
      timestamp: getRelativeTimestampISO(-2),
      xpPoints: 15,
    },
    {
      id: 'log-2',
      title: 'Helle Wäsche aufgehängt',
      category: 'laundry',
      completedBy: 'member-a',
      completedByName: 'Maddin',
      completedByAvatar: '🧑‍🚀',
      timestamp: getRelativeTimestampISO(-5),
      xpPoints: 20,
    },
    {
      id: 'log-3',
      title: 'Dunkle Wäsche gestartet',
      category: 'laundry',
      completedBy: 'member-b',
      completedByName: 'Alex',
      completedByAvatar: '👩‍🚀',
      timestamp: getRelativeTimestampISO(-12),
      xpPoints: 10,
    },
    {
      id: 'log-4',
      title: 'Altglas weggebracht',
      category: 'waste',
      completedBy: 'member-a',
      completedByName: 'Maddin',
      completedByAvatar: '🧑‍🚀',
      timestamp: getRelativeTimestampISO(-28),
      xpPoints: 30,
    },
    {
      id: 'log-5',
      title: 'Klo gereinigt',
      category: 'chore',
      completedBy: 'member-b',
      completedByName: 'Alex',
      completedByAvatar: '👩‍🚀',
      timestamp: getRelativeTimestampISO(-72),
      xpPoints: 40,
    },
  ],
}
