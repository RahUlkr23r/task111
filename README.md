# Northside Physio — Slot Picker

A Vite + React booking interface for a physiotherapy clinic. The booking logic is intentionally simple, transparent, and interview-friendly so that the availability algorithm can be explained clearly while the UI remains polished.

## Availability anomaly note

The initial diary intentionally contains two overlapping confirmed appointments:

- 11:30–12:00
- 11:45–12:30

This is not a data error in the exercise. It mirrors a real-world scheduling anomaly where two bookings may overlap in the diary, and both should be treated as blocking time for future availability checks. The availability code preserves both records and applies the half-open overlap rule to any proposed appointment interval.

The cancelled record at 14:30–15:30 is also intentionally kept in the diary, but it is excluded from availability checks because cancelled appointments do not block availability.

## Running locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
