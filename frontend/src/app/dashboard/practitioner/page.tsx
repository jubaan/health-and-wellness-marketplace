'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface BookedAppointment {
    id: number;
    start_time: string;
    end_time: string;
    patient_first_name: string;
    patient_last_name: string;
}

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
}

export default function PractitionerDashboardPage() {
    const { userId } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetch(`/api/practitioners/${userId}/availability`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch schedule');
                    return res.json();
                })
                .then(data => {
                    const bookedEvents = data.bookedAppointments.map((app: BookedAppointment) => ({
                        title: `Appointment with ${app.patient_first_name} ${app.patient_last_name}`,
                        start: new Date(app.start_time),
                        end: new Date(app.end_time),
                    }));
                    // In a real app, you might want to show available slots differently
                    // For now, we'll just show the booked appointments.
                    setEvents(bookedEvents);
                })
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [userId]);

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-6">My Schedule</h1>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div style={{ height: '70vh' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                    />
                </div>
            )}
        </div>
    );
}
