'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const practitionerSchema = z.object({
  specialty: z.string().min(1, 'Specialty is required'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().optional(),
  hourly_rate: z.coerce.number().min(0, 'Hourly rate must be a positive number').optional(),
  insurance_accepted: z.string().optional(),
});

type PractitionerFormData = z.infer<typeof practitionerSchema>;

export default function EditPractitionerProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PractitionerFormData>({
    resolver: zodResolver(practitionerSchema),
  });

  useEffect(() => {
    if (user) {
      // Fetch existing profile data and populate the form
      fetch(`/api/practitioners/${user.id}`)
        .then((res) => {
            if (res.ok) return res.json()
            return null
        })
        .then((data) => {
          if (data) {
            reset({
                ...data,
                insurance_accepted: data.insurance_accepted?.join(', ')
            });
          }
        });
    }
  }, [user, reset]);

  const onSubmit = async (data: PractitionerFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
        ...data,
        insurance_accepted: data.insurance_accepted?.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      const response = await fetch(`/api/practitioners/${user.id}`, {
        method: 'PUT', // This should be a PUT to update, or POST to create
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // A more robust solution would be to try a POST if the PUT fails with a 404
        const postResponse = await fetch(`/api/practitioners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!postResponse.ok) {
            throw new Error('Failed to save profile');
        }
      }
      router.push('/profile');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Calendar Sync</h2>
        <p className="text-gray-600 mb-4">Connect your calendar to automatically manage your availability.</p>
        <a href="/api/oauth/google">
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Connect Google Calendar
            </button>
        </a>
        {/* I'll add Outlook later */}
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Practitioner Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 border rounded-lg">
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Specialty</label>
          <input id="specialty" {...register('specialty')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty.message}</p>}
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input id="location" {...register('location')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea id="bio" {...register('bio')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
          <input id="hourly_rate" type="number" step="0.01" {...register('hourly_rate')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          {errors.hourly_rate && <p className="text-red-500 text-xs mt-1">{errors.hourly_rate.message}</p>}
        </div>
        <div>
          <label htmlFor="insurance_accepted" className="block text-sm font-medium text-gray-700">Insurance Accepted (comma-separated)</label>
          <input id="insurance_accepted" {...register('insurance_accepted')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
