# Notifications

## Channels
- Email (SendGrid): transactional messages
- WhatsApp/SMS (Twilio): confirmations, reminders (MVP focuses on WhatsApp)

## Preferences
- Model: `NotificationPreference`
- UI: `/settings/notifications`
- Fields: `emailEnabled`, `whatsappEnabled`, `smsEnabled`, and event toggles

## Triggers
- Booking: patient + practitioner
- Cancel: patient + practitioner
- Reminders: 24h and 1h (patient)

## Endpoints
- `GET/POST /api/notifications/preferences`
- `POST /api/jobs/reminders?windowMin=15`

## Templates
- MVP: plain text
- Next: branded HTML, i18n (ES/MX), variables (name, date, policy links)

## Providers
- SendGrid: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`

