# Booking & Scheduling

## Availability
- Rules by day of week with start/end minutes
- Practitioner policy: `slotMinutes`, `bufferMinutes`, `cancellationWindowHours`
- UI: `/practitioner/availability`

## Slot Computation
- Endpoint: `GET /api/availability/slots?practitionerId=&date=YYYY-MM-DD`
- Filters:
  - Platform appointments (with buffers)
  - Google FreeBusy when connected

## Booking Flow
- Endpoint: `POST /api/appointments { practitionerId, startsAtISO }`
- Checks:
  - Overlap with platform appointments (with buffer)
  - Google FreeBusy (if connected)
- On success:
  - Create DB appointment (UTC)
  - Create Google event (if connected)
  - Send notifications (patient + practitioner)

## Cancellation
- Endpoint: `PATCH /api/appointments/:id { action: "cancel" }`
- Allowed by: patient, practitioner, or delegate with canManageAppointments
- Consideration: honor `cancellationWindowHours` in future iteration

## Timezones
- Store UTC in DB
- Display using client locale; plan to add user-preferred timezone

## Reminders
- Endpoint (cron-friendly): `POST /api/jobs/reminders?windowMin=15`
- Sends 24h and 1h reminders, idempotent via `ReminderSent`
- Protect with `X-Cron-Secret` or platform_admin

