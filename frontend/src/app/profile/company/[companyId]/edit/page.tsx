'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const inviteSchema = z.object({
    email: z.string().email('Must be a valid email address'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface Practitioner {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function EditCompanyPage({ params }: { params: { companyId: string } }) {
  const router = useRouter();
  const { companyId } = params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors },
    } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
    });

  useEffect(() => {
    if (companyId) {
      // Fetch existing company data
      fetch(`/api/companies/${companyId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) reset(data); });

      // Fetch practitioners
      fetch(`/api/companies/${companyId}/practitioners`)
        .then((res) => (res.ok ? res.json() : []))
        .then(setPractitioners);
    }
  }, [companyId, reset]);

  const onCompanySubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update company');
      router.push('/profile');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInviteSubmit = async (data: InviteFormData) => {
    setInviteError(null);
    setInviteSuccess(null);
    try {
        // 1. Find user by email
        const userRes = await fetch(`/api/users/by-email/${data.email}`);
        if (!userRes.ok) {
            setInviteError('User with this email not found.');
            return;
        }
        const user = await userRes.json();

        // 2. Send invitation
        const invRes = await fetch(`/api/companies/${companyId}/invitations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inviteeUserId: user.id }),
        });

        if (!invRes.ok) {
            const errData = await invRes.json();
            throw new Error(errData.error || 'Failed to send invitation');
        }

        setInviteSuccess(`Invitation sent to ${data.email}!`);
        resetInvite();

    } catch (err: any) {
        setInviteError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Edit Company</h1>
        <form onSubmit={handleSubmit(onCompanySubmit)} className="space-y-4">
            {/* Form fields for company details */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
                <input id="name" {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            {/* ... other fields ... */}
            <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Manage Practitioners</h2>
        <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Invite a Practitioner</h3>
            <form onSubmit={handleSubmitInvite(onInviteSubmit)} className="flex items-start gap-2 mt-2">
                <div className="flex-grow">
                    <input id="email" {...registerInvite('email')} placeholder="practitioner@email.com" className="w-full rounded-md border-gray-300 shadow-sm" />
                    {inviteErrors.email && <p className="text-red-500 text-xs mt-1">{inviteErrors.email.message}</p>}
                </div>
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Invite</button>
            </form>
            {inviteError && <p className="text-red-500 text-sm mt-2">{inviteError}</p>}
            {inviteSuccess && <p className="text-green-500 text-sm mt-2">{inviteSuccess}</p>}
        </div>

        <div className="mt-6">
            <h3 className="font-semibold">Current Practitioners</h3>
            <ul className="mt-2 space-y-2">
                {practitioners.map(p => (
                    <li key={p.id} className="p-2 border rounded-md flex justify-between items-center">
                        <span>{p.first_name} {p.last_name} ({p.email})</span>
                    </li>
                ))}
                {practitioners.length === 0 && <p className="text-gray-500">No practitioners yet.</p>}
            </ul>
        </div>
      </div>
    </div>
  );
}
