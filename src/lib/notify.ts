import { prisma } from "@/lib/prisma";

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key || !from) return;
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });
  if (!res.ok) {
    console.error("SendGrid error", await res.text());
  }
}

async function sendWhatsApp(toNumber: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from || !toNumber) return;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams();
  params.set("From", from);
  params.set("To", toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`);
  params.set("Body", body);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
    body: params,
  });
  if (!res.ok) {
    console.error("Twilio error", await res.text());
  }
}

async function getPrefs(userProfileId: string) {
  let prefs = await prisma.notificationPreference.findUnique({ where: { userProfileId } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { userProfileId } });
  }
  return prefs;
}

export async function notifyAppointmentBooked(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { practitioner: { include: { userProfile: true } }, patient: { include: { userProfile: true } }, company: true },
  });
  if (!appt) return;

  // Patient
  if (appt.patient?.userProfileId) {
    const prefs = await getPrefs(appt.patient.userProfileId);
    if (prefs.onBooking) {
      if (prefs.emailEnabled) await sendEmail(appt.patient.userProfile.email, "Tu cita fue programada", `Tu cita con ${appt.practitioner.displayName} es el ${appt.startsAt.toUTCString()}.`);
      if (prefs.whatsappEnabled && prefs.whatsappNumber) await sendWhatsApp(prefs.whatsappNumber, `Tu cita con ${appt.practitioner.displayName} es el ${appt.startsAt.toUTCString()}.`);
    }
  }

  // Practitioner
  if (appt.practitioner?.userProfileId) {
    const prefs = await getPrefs(appt.practitioner.userProfileId);
    if (prefs.onBooking) {
      if (prefs.emailEnabled) await sendEmail(appt.practitioner.userProfile.email, "Nueva cita programada", `Nueva cita con paciente ${appt.patient.id} el ${appt.startsAt.toUTCString()}.`);
      if (prefs.whatsappEnabled && prefs.whatsappNumber) await sendWhatsApp(prefs.whatsappNumber, `Nueva cita con paciente ${appt.patient.id} el ${appt.startsAt.toUTCString()}.`);
    }
  }
}

export async function notifyAppointmentCanceled(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { practitioner: { include: { userProfile: true } }, patient: { include: { userProfile: true } }, company: true },
  });
  if (!appt) return;

  if (appt.patient?.userProfileId) {
    const prefs = await getPrefs(appt.patient.userProfileId);
    if (prefs.onCancel) {
      if (prefs.emailEnabled) await sendEmail(appt.patient.userProfile.email, "Tu cita fue cancelada", `Tu cita con ${appt.practitioner.displayName} del ${appt.startsAt.toUTCString()} fue cancelada.`);
      if (prefs.whatsappEnabled && prefs.whatsappNumber) await sendWhatsApp(prefs.whatsappNumber, `Tu cita con ${appt.practitioner.displayName} del ${appt.startsAt.toUTCString()} fue cancelada.`);
    }
  }

  if (appt.practitioner?.userProfileId) {
    const prefs = await getPrefs(appt.practitioner.userProfileId);
    if (prefs.onCancel) {
      if (prefs.emailEnabled) await sendEmail(appt.practitioner.userProfile.email, "Cita cancelada", `La cita con paciente ${appt.patient.id} del ${appt.startsAt.toUTCString()} fue cancelada.`);
      if (prefs.whatsappEnabled && prefs.whatsappNumber) await sendWhatsApp(prefs.whatsappNumber, `La cita con paciente ${appt.patient.id} del ${appt.startsAt.toUTCString()} fue cancelada.`);
    }
  }
}

export async function sendReminderFor(appointmentId: string, type: "H24" | "H1") {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { practitioner: { include: { userProfile: true } }, patient: { include: { userProfile: true } } } });
  if (!appt) return;

  const sent = await prisma.reminderSent.findUnique({ where: { appointmentId_type: { appointmentId, type } } });
  if (sent) return;

  // Patient only for reminders (MVP)
  if (appt.patient?.userProfileId) {
    const prefs = await getPrefs(appt.patient.userProfileId);
    if (prefs.onReminder) {
      const when = type === "H24" ? "24 horas" : "1 hora";
      if (prefs.emailEnabled) await sendEmail(appt.patient.userProfile.email, `Recordatorio: tu cita en ${when}`, `Tu cita con ${appt.practitioner.displayName} es el ${appt.startsAt.toUTCString()}.`);
      if (prefs.whatsappEnabled && prefs.whatsappNumber) await sendWhatsApp(prefs.whatsappNumber, `Recordatorio: tu cita con ${appt.practitioner.displayName} es el ${appt.startsAt.toUTCString()}.`);
    }
  }

  await prisma.reminderSent.create({ data: { appointmentId, type: type as any } });
}

