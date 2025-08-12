'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Slot {
    start: string;
    end: string;
}

const CheckoutForm = ({ selectedSlot, practitionerId, onSuccessfulPayment }: { selectedSlot: Slot, practitionerId: string, onSuccessfulPayment: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/booking-success` },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message ?? 'An unexpected error occurred.');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment succeeded, now book the appointment
            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        practitionerId: practitionerId,
                        startTime: selectedSlot.start,
                        endTime: selectedSlot.end,
                    }),
                });
                if (!response.ok) throw new Error('Failed to book appointment after payment.');
                onSuccessfulPayment();
            } catch (bookingError: any) {
                setErrorMessage(bookingError.message);
            }
        }
        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={isProcessing || !stripe || !elements} className="w-full bg-blue-500 text-white py-2 rounded-md mt-4">
                {isProcessing ? "Processing..." : "Pay and Book"}
            </button>
            {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
        </form>
    );
};


export default function AvailabilityPage({ params }: { params: { userId: string } }) {
    const { userId } = params;
    const router = useRouter();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetch(`/api/practitioners/${userId}/availability`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch availability'))
                .then(setSlots)
                .catch(err => setError(err.toString()))
                .finally(() => setIsLoading(false));
        }
    }, [userId]);

    const handleSlotSelection = async (slot: Slot) => {
        setSelectedSlot(slot);
        setError(null);
        try {
            const res = await fetch('/api/payments/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 5000 }), // Example amount
            });
            if (!res.ok) throw new Error('Failed to create payment intent.');
            const { clientSecret } = await res.json();
            setClientSecret(clientSecret);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const onSuccessfulPayment = () => {
        alert('Appointment booked successfully!');
        router.push('/profile');
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-6">Available Slots</h1>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!selectedSlot ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {slots.map((slot, index) => (
                        <button key={index} onClick={() => handleSlotSelection(slot)} className="p-4 border rounded-lg text-center hover:bg-gray-100">
                            <p>{new Date(slot.start).toLocaleDateString()}</p>
                            <p className="font-bold">{new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </button>
                    ))}
                </div>
            ) : (
                clientSecret && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl font-bold mb-4">Confirm and Pay</h2>
                        <p>You are booking an appointment for {new Date(selectedSlot.start).toLocaleString()}.</p>
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm selectedSlot={selectedSlot} practitionerId={userId} onSuccessfulPayment={onSuccessfulPayment} />
                        </Elements>
                        <button onClick={() => setSelectedSlot(null)} className="text-sm text-gray-600 mt-4">Cancel</button>
                    </div>
                )
            )}
        </div>
    );
}
