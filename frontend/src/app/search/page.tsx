'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface Practitioner {
    id: string;
    first_name: string;
    last_name: string;
    specialty: string;
    location: string;
    bio: string;
}

interface SearchFormData {
    location: string;
    specialty: string;
}

export default function SearchPage() {
    const { register, handleSubmit } = useForm<SearchFormData>();
    const [results, setResults] = useState<Practitioner[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: SearchFormData) => {
        setIsLoading(true);
        const query = new URLSearchParams(data as any).toString();
        try {
            const response = await fetch(`/api/search/practitioners?${query}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-6">Find a Practitioner</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-gray-100 rounded-lg flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input id="location" {...register('location')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div className="flex-grow">
                    <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Specialty</label>
                    <input id="specialty" {...register('specialty')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="mt-8">
                <h2 className="text-2xl font-bold">Results</h2>
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {results.length > 0 ? (
                            results.map(p => (
                                <div key={p.id} className="p-4 border rounded-lg flex flex-col">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold">{p.first_name} {p.last_name}</h3>
                                        <p className="font-semibold text-blue-600">{p.specialty}</p>
                                        <p className="text-gray-600 mt-1">{p.location}</p>
                                        <p className="mt-2 text-sm">{p.bio}</p>
                                    </div>
                                    <Link href={`/practitioners/${p.id}/availability`} className="mt-4">
                                        <button className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                            View Availability
                                        </button>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p>No results found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
