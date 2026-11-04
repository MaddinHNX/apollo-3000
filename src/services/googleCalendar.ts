// Google Calendar Integration Service for Apollo 3000
import type { HouseholdMember, KitchenChore, StandardChore } from '../types/household'
import { getChoreDueInfo } from '../components/dashboard/TodayChoresList'

export class GoogleCalendarService {
  /**
   * Generates a 1-click Google Calendar Web Intent Link targeted to a specific calendar (e.g. schorleweg@gmail.com)
   */
  static createWebIntentUrl(
    chore: StandardChore,
    assigneeName: string,
    calendarEmail?: string
  ): string {
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

    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`
    if (calendarEmail && calendarEmail.includes('@')) {
      url += `&src=${encodeURIComponent(calendarEmail)}`
    }
    return url
  }

  /**
   * Generates a standard .ics iCalendar file content for ALL weekly chores and kitchen tasks.
   * This allows importing the complete schedule into Google Calendar with a single click.
   */
  static generateIcsContent(
    chores: (StandardChore | KitchenChore)[],
    members: HouseholdMember[],
    householdName: string
  ): string {
    const formatIcsDate = (date: Date): string => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z'
    }

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apollo 3000//Haushaltsplan//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Apollo 3000 - ${householdName}`,
      'X-WR-TIMEZONE:Europe/Berlin',
    ]

    const now = new Date()

    chores.forEach((chore, index) => {
      const dueInfo = getChoreDueInfo(chore as unknown as StandardChore)
      const assignee = members.find((m) => m.id === chore.assignedTo)
      const assigneeName = assignee ? assignee.name : 'Haushalt'

      const eventStart = new Date(now)
      eventStart.setDate(eventStart.getDate() + Math.max(0, dueInfo.daysRemaining))
      eventStart.setHours(10 + (index % 4), 0, 0, 0) // Verteilt Zeiten auf 10:00, 11:00, etc.

      const eventEnd = new Date(eventStart.getTime() + (chore.estimatedMinutes || 20) * 60 * 1000)

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:apollo3000-${chore.id}-${eventStart.getTime()}@apollo3000.app`)
      lines.push(`DTSTAMP:${formatIcsDate(now)}`)
      lines.push(`DTSTART:${formatIcsDate(eventStart)}`)
      lines.push(`DTEND:${formatIcsDate(eventEnd)}`)
      lines.push(`SUMMARY:Apollo 3000: ${chore.title} (${assigneeName})`)
      lines.push(
        `DESCRIPTION:${chore.description || chore.title}\\nZuständig: ${assigneeName}\\nDauer: ca. ${chore.estimatedMinutes} Min.\\nIntervall: alle ${chore.intervalDays} Tage`
      )
      lines.push('STATUS:CONFIRMED')
      lines.push('BEGIN:VALARM')
      lines.push('TRIGGER:-PT30M')
      lines.push('ACTION:DISPLAY')
      lines.push(`DESCRIPTION:Erinnerung: ${chore.title}`)
      lines.push('END:VALARM')
      lines.push('END:VEVENT')
    })

    lines.push('END:VCALENDAR')
    return lines.join('\r\n')
  }

  /**
   * Downloads the complete weekly schedule as .ics file that imports instantly into Google Calendar / Apple Calendar
   */
  static downloadIcsFile(
    chores: (StandardChore | KitchenChore)[],
    members: HouseholdMember[],
    householdName: string
  ): void {
    const icsContent = this.generateIcsContent(chores, members, householdName)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `apollo3000-wochenplan-${new Date().toISOString().split('T')[0]}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
