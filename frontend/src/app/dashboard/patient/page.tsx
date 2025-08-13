'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface Appointment {
    id: number;
    start_time: string;
    end_time: string;
    practitioner_first_name: string;
    practitioner_last_name: string;
}

export default function PatientDashboardPage() {
    const { userId } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetch('/api/users/me/appointments')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch appointments');
                    return res.json();
                })
                .then(setAppointments)
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [userId]);

    const upcomingAppointments = appointments.filter(a => new Date(a.start_time) > new Date());
    const pastAppointments = appointments.filter(a => new Date(a.start_time) <= new Date());

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-6">My Appointments</h1>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Upcoming Appointments</h2>
                        {upcomingAppointments.length > 0 ? (
                            <ul className="space-y-4">
                                {upcomingAppointments.map(app => (
                                    <li key={app.id} className="p-4 border rounded-lg">
                                        <p><strong>Practitioner:</strong> {app.practitioner_first_name} {app.practitioner_last_name}</p>
                                        <p><strong>Date:</strong> {new Date(app.start_time).toLocaleDateString()}</p>
                                        <p><strong>Time:</strong> {new Date(app.start_time).toLocaleTimeString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You have no upcoming appointments.</p>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Past Appointments</h2>
                        {pastAppointments.length > 0 ? (
                            <ul className="space-y-4">
                                {pastAppointments.map(app => (
                                    <li key={app.id} className="p-4 border rounded-lg bg-gray-50">
                                        <p><strong>Practitioner:</strong> {app.practitioner_first_name} {app.practitioner_last_name}</p>
                                        <p><strong>Date:</strong> {new Date(app.start_time).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You have no past appointments.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
