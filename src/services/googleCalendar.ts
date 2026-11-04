// Google Calendar Integration Service for Apollo 3000
import type { StandardChore } from '../types/household'

export interface GoogleCalendarEventPayload {
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime?: string // HH:mm (optional, default 10:00)
  durationMinutes: number
}

const STORAGE_CALENDAR_TOKEN_KEY = 'apollo3000_gcal_access_token'

export class GoogleCalendarService {
  /**
   * Generates a 1-click Google Calendar Web Intent Link (works on mobile & desktop without OAuth setup)
   */
  static createWebIntentUrl(chore: StandardChore, assigneeName: string): string {
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setHours(10, 0, 0, 0)

    const startISO = targetDate.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z'
    const endDate = new Date(targetDate.getTime() + chore.estimatedMinutes * 60 * 1000)
    const endISO = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z'

    const title = encodeURIComponent(`Apollo 3000: ${chore.title} (${assigneeName})`)
    const details = encodeURIComponent(
      `${chore.description || chore.title}\n\nZuständig: ${assigneeName}\nGeschätzter Aufwand: ca. ${chore.estimatedMinutes} Minuten\nIntervall: alle ${chore.intervalDays} Tage\n\nErstellt von Apollo 3000 Haushalts-App.`
    )
    const dates = `${startISO}/${endISO}`

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`
  }

  /**
   * Stores an OAuth Access Token for direct REST API calls
   */
  static saveAccessToken(token: string): void {
    localStorage.setItem(STORAGE_CALENDAR_TOKEN_KEY, token)
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_CALENDAR_TOKEN_KEY)
  }

  static removeAccessToken(): void {
    localStorage.removeItem(STORAGE_CALENDAR_TOKEN_KEY)
  }

  /**
   * Adds an event directly to Google Calendar via REST API if an OAuth access token is present
   */
  static async addEventToGoogleCalendar(
    token: string,
    chore: StandardChore,
    assigneeName: string
  ): Promise<{ success: boolean; eventLink?: string; error?: string }> {
    try {
      const now = new Date()
      const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)
      const endDateTime = new Date(startDateTime.getTime() + chore.estimatedMinutes * 60 * 1000)

      const body = {
        summary: `Apollo 3000: ${chore.title} (${assigneeName})`,
        description: `${chore.description || chore.title}\n\nZuständigkeit: ${assigneeName}\nDauer: ca. ${chore.estimatedMinutes} Min.\nIntervall: alle ${chore.intervalDays} Tage`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 120 },
          ],
        },
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errData.error?.message || `HTTP Fehler ${response.status}`,
        }
      }

      const data = await response.json()
      return { success: true, eventLink: data.htmlLink }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      }
    }
  }
}
