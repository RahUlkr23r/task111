export const CLINIC_OPEN = 9 * 60
export const CLINIC_CLOSE = 17 * 60
export const LUNCH_START = 13 * 60
export const LUNCH_END = 14 * 60
export const SLOT_INTERVAL = 15

export const SERVICE_OPTIONS = {
  'follow-up': { id: 'follow-up', label: 'Follow-up', duration: 15 },
  consultation: { id: 'consultation', label: 'Consultation', duration: 30 },
  treatment: { id: 'treatment', label: 'Treatment', duration: 45 },
  'full-assessment': {
    id: 'full-assessment',
    label: 'Full assessment',
    duration: 60,
  },
}

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function generateStartTimes() {
  const times = []
  for (let minutes = CLINIC_OPEN; minutes <= 16 * 60 + 45; minutes += SLOT_INTERVAL) {
    times.push(minutes)
  }
  return times
}

export function hasOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

export function isSlotAvailable(startTime, duration, diary = []) {
  const appointmentStart = startTime
  const appointmentEnd = startTime + duration

  if (appointmentEnd > CLINIC_CLOSE) {
    return false
  }

  if (hasOverlap(appointmentStart, appointmentEnd, LUNCH_START, LUNCH_END)) {
    return false
  }

  return !diary.some((entry) => {
    if (entry.status === 'cancelled') {
      return false
    }

    return hasOverlap(
      appointmentStart,
      appointmentEnd,
      timeToMinutes(entry.start),
      timeToMinutes(entry.end),
    )
  })
}

export function getSlotStatus(startTime, duration, diary = []) {
  return isSlotAvailable(startTime, duration, diary) ? 'available' : 'unavailable'
}
