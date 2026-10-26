import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { initialDiary } from './data/diary'
import {
  SERVICE_OPTIONS,
  generateStartTimes,
  getSlotStatus,
  isSlotAvailable,
  minutesToTime,
} from './utils/availability'

const STORAGE_KEY = 'northside-physio-diary'
const DEFAULT_SERVICE = 'consultation'

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHour = ((hours + 11) % 12) + 1

  return `${displayHour}:${String(mins).padStart(2, '0')} ${suffix}`
}

function formatRange(startMinutes, endMinutes) {
  return `${formatTime(startMinutes)} – ${formatTime(endMinutes)}`
}

function App() {
  const [diary, setDiary] = useState(() => {
    if (typeof window === 'undefined') {
      return initialDiary
    }

    const savedDiary = window.localStorage.getItem(STORAGE_KEY)

    if (!savedDiary) {
      return initialDiary
    }

    try {
      const parsedDiary = JSON.parse(savedDiary)
      return Array.isArray(parsedDiary) && parsedDiary.length > 0 ? parsedDiary : initialDiary
    } catch {
      return initialDiary
    }
  })
  const [selectedServiceKey, setSelectedServiceKey] = useState(DEFAULT_SERVICE)
  const [selectedStartTime, setSelectedStartTime] = useState(null)
  const [bookingMessage, setBookingMessage] = useState('')
  const [selectionMessage, setSelectionMessage] = useState('')

  const slotTimes = useMemo(() => generateStartTimes(), [])
  const selectedService = SERVICE_OPTIONS[selectedServiceKey]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diary))
    }
  }, [diary])

  const selectedEndTime =
    selectedStartTime !== null ? selectedStartTime + selectedService.duration : null

  const handleServiceChange = (nextServiceKey) => {
    if (nextServiceKey === selectedServiceKey) {
      return
    }

    const nextService = SERVICE_OPTIONS[nextServiceKey]
    setSelectedServiceKey(nextServiceKey)
    setBookingMessage('')

    if (selectedStartTime === null) {
      setSelectionMessage('')
      return
    }

    const stillAvailable = isSlotAvailable(selectedStartTime, nextService.duration, diary)

    if (stillAvailable) {
      setSelectionMessage('')
      return
    }

    setSelectedStartTime(null)
    setSelectionMessage(
      `The previous selection is no longer available for ${nextService.label.toLowerCase()}. Please choose another time.`,
    )
  }

  const handleSlotClick = (slotTime) => {
    setBookingMessage('')

    if (selectedStartTime === slotTime) {
      setSelectedStartTime(null)
      setSelectionMessage('')
      return
    }

    const status = getSlotStatus(slotTime, selectedService.duration, diary)

    if (status === 'unavailable') {
      return
    }

    setSelectedStartTime(slotTime)
    setSelectionMessage('')
  }

  const handleBookAppointment = () => {
    if (selectedStartTime === null) {
      return
    }

    if (!isSlotAvailable(selectedStartTime, selectedService.duration, diary)) {
      setSelectedStartTime(null)
      setBookingMessage('That time is no longer available. Please choose another slot.')
      return
    }

    const nextId = diary.reduce(
      (maxId, appointment) => Math.max(maxId, Number(appointment.id) || 0),
      0,
    ) + 1

    const newAppointment = {
      id: nextId,
      start: minutesToTime(selectedStartTime),
      end: minutesToTime(selectedStartTime + selectedService.duration),
      status: 'confirmed',
    }

    setDiary((currentDiary) => [...currentDiary, newAppointment])
    setSelectedStartTime(null)
    setBookingMessage(
      `Booked ${selectedService.label.toLowerCase()} for ${formatRange(selectedStartTime, selectedStartTime + selectedService.duration)}.`,
    )
    setSelectionMessage('')
  }

  const handleReset = () => {
    const resetDiary = initialDiary.map((entry) => ({ ...entry }))
    setDiary(resetDiary)
    setSelectedStartTime(null)
    setSelectedServiceKey(DEFAULT_SERVICE)
    setBookingMessage('')
    setSelectionMessage('')

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resetDiary))
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="brand-mark">Northside Physio</p>
          <p className="tagline">Your health, your time.</p>
        </div>
        <div className="hours-pill">Clinic hours: 9:00 AM – 5:00 PM</div>
      </header>

      <main className="booking-layout">
        <section className="booking-panel">
          <div className="intro-block">
            <p className="eyebrow">Appointments</p>
            <h1>Book your appointment</h1>
            <p className="supporting-copy">
              Choose a service and select an available start time that works for your care plan.
            </p>
          </div>

          <div className="service-selector" role="radiogroup" aria-label="Appointment services">
            {Object.values(SERVICE_OPTIONS).map((service) => (
              <button
                key={service.id}
                type="button"
                className={selectedServiceKey === service.id ? 'service-option active' : 'service-option'}
                onClick={() => handleServiceChange(service.id)}
                aria-pressed={selectedServiceKey === service.id}
              >
                <span>{service.label}</span>
                <strong>{service.duration} min</strong>
              </button>
            ))}
          </div>

          <div className="slot-grid-wrapper">
            <div className="grid-header">
              <h2>Available times</h2>
              <span>Every appointment starts on a 15-minute interval</span>
            </div>

            <div className="slot-grid" role="grid" aria-label="Available appointment times">
              {slotTimes.map((slotTime) => {
                const status = getSlotStatus(slotTime, selectedService.duration, diary)
                const isSelected = selectedStartTime === slotTime
                const isWithinSelectedRange =
                  selectedStartTime !== null &&
                  selectedEndTime !== null &&
                  slotTime >= selectedStartTime &&
                  slotTime < selectedEndTime

                return (
                  <button
                    key={slotTime}
                    type="button"
                    className={[
                      'slot-button',
                      status,
                      isSelected ? 'selected' : '',
                      isWithinSelectedRange ? 'range-highlight' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={status === 'unavailable'}
                    onClick={() => handleSlotClick(slotTime)}
                    aria-pressed={isSelected}
                  >
                    {formatTime(slotTime)}
                  </button>
                )
              })}
            </div>
          </div>

          {selectionMessage ? <p className="inline-message warning">{selectionMessage}</p> : null}
          {bookingMessage ? <p className="inline-message success">{bookingMessage}</p> : null}
        </section>

        <aside className="summary-panel">
          <div className="summary-card">
            <p className="summary-label">Selected appointment</p>

            {selectedStartTime !== null && selectedEndTime !== null ? (
              <>
                <h3>{selectedService.label}</h3>
                <p className="appointment-time">{formatRange(selectedStartTime, selectedEndTime)}</p>
                <p className="duration-copy">Duration: {selectedService.duration} minutes</p>
              </>
            ) : (
              <p className="empty-state">Choose an available start time to continue.</p>
            )}
          </div>

          <button
            type="button"
            className="book-button"
            disabled={selectedStartTime === null}
            onClick={handleBookAppointment}
          >
            Book Appointment
          </button>

          <button type="button" className="reset-button" onClick={handleReset}>
            Reset to today's diary
          </button>
        </aside>
      </main>
    </div>
  )
}

export default App
