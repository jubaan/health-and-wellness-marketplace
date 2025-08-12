'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Company {
    id: number;
    name: string;
}

interface Practitioner {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function CompanyDashboardPage() {
    const { userId } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetch('/api/users/me/companies')
                .then(res => res.json())
                .then(setCompanies)
                .finally(() => setIsLoading(false));
        }
    }, [userId]);

    useEffect(() => {
        if (selectedCompany) {
            fetch(`/api/companies/${selectedCompany.id}/practitioners`)
                .then(res => res.json())
                .then(setPractitioners);
        } else {
            setPractitioners([]);
        }
    }, [selectedCompany]);

    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-6">Company Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h2 className="text-2xl font-bold mb-4">Your Companies</h2>
                    <div className="space-y-2">
                        {companies.length > 0 ? (
                            companies.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCompany(c)}
                                    className={`w-full text-left p-3 rounded-lg ${selectedCompany?.id === c.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    {c.name}
                                </button>
                            ))
                        ) : (
                            <p>You have not created any companies yet.</p>
                        )}
                        <Link href="/profile/company/new">
                            <button className="w-full mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                + Create New Company
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="md:col-span-2">
                    {selectedCompany ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Practitioners at {selectedCompany.name}</h2>
                            <Link href={`/profile/company/${selectedCompany.id}/edit`}>
                                <button className="mb-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                    Manage Company & Invite
                                </button>
                            </Link>
                            {practitioners.length > 0 ? (
                                <ul className="space-y-2">
                                    {practitioners.map(p => (
                                        <li key={p.id} className="p-3 border rounded-lg">
                                            {p.first_name} {p.last_name} ({p.email})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No practitioners have been added to this company yet.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">Select a company to view its practitioners.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
