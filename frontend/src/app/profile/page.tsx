'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Invitation {
    id: number;
    company_id: number;
    user_id: string;
    status: string;
}

interface Roles {
    isPractitioner: boolean;
    isCompanyOwner: boolean;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Roles | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/users/me/invitations').then(res => res.json()).then(setInvitations);
      fetch('/api/users/me/roles').then(res => res.json()).then(setRoles);
    }
  }, [user]);

  const handleInvitation = async (invitationId: number, status: 'accepted' | 'declined') => {
    const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
    }
  };

  if (!user || !roles) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold my-6">Welcome, {user.firstName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/patient" className="p-6 bg-blue-500 text-white rounded-lg text-center font-bold text-xl hover:bg-blue-600">
            Patient Dashboard
        </Link>
        {roles.isPractitioner && (
            <Link href="/dashboard/practitioner" className="p-6 bg-green-500 text-white rounded-lg text-center font-bold text-xl hover:bg-green-600">
                Practitioner Dashboard
            </Link>
        )}
        {roles.isCompanyOwner && (
            <Link href="/dashboard/company" className="p-6 bg-purple-500 text-white rounded-lg text-center font-bold text-xl hover:bg-purple-600">
                Company Dashboard
            </Link>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50">
            <h2 className="text-xl font-bold">Pending Invitations</h2>
            {/* ... invitation list ... */}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Profile & Settings</h2>
        <div className="flex gap-4">
            <Link href="/profile/practitioner/edit">
                <button className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded">
                    Edit Practitioner Profile
                </button>
            </Link>
            <Link href="/profile/company/new">
                <button className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded">
                    Create a New Company
                </button>
            </Link>
        </div>
      </div>
    </div>
  );
}
