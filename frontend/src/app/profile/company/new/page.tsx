'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create company');
      }

      const newCompany = await response.json();
      // Redirect to the edit page for the new company
      router.push(`/profile/company/${newCompany.id}/edit`);

    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create a New Company</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
          <input id="name" {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
          <input id="website" {...register('website')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <input id="address" {...register('address')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" {...register('description')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          {isSubmitting ? 'Creating...' : 'Create Company'}
        </button>
      </form>
    </div>
  );
}
