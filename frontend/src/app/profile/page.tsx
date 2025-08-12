'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Invitation {
    id: number;
    company_id: number;
    user_id: string;
    status: string;
    // I should probably fetch company name as well in a real app
}

export default function ProfilePage() {
  const { user } = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (user) {
      fetch('/api/users/me/invitations')
        .then(res => res.ok ? res.json() : [])
        .then(setInvitations);
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


  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}</h1>
      <p>This is your central hub for managing your professional presence on our platform.</p>

      {invitations.length > 0 && (
        <div className="mt-8 p-6 border rounded-lg bg-blue-50">
            <h2 className="text-xl font-bold">Pending Invitations</h2>
            <ul className="mt-4 space-y-2">
                {invitations.map(inv => (
                    <li key={inv.id} className="p-3 border rounded-md bg-white flex justify-between items-center">
                        <span>You have an invitation to join company {inv.company_id}.</span>
                        <div className="flex gap-2">
                            <button onClick={() => handleInvitation(inv.id, 'accepted')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">Accept</button>
                            <button onClick={() => handleInvitation(inv.id, 'declined')} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Decline</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="mt-8 p-6 border rounded-lg">
        <h2 className="text-xl font-bold">Your Practitioner Profile</h2>
        <p className="text-gray-600 mt-2">
          Showcase your skills, specialty, and experience to connect with patients.
        </p>
        <Link href="/profile/practitioner/edit">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            Create or Edit Practitioner Profile
          </button>
        </Link>
      </div>

      <div className="mt-8 p-6 border rounded-lg">
        <h2 className="text-xl font-bold">Your Companies</h2>
        <p className="text-gray-600 mt-2">
            Manage your clinics, hospitals, or healthcare groups.
        </p>
        <Link href="/profile/company/new">
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
            Create a new Company
          </button>
        </Link>
      </div>
    </div>
  );
}
