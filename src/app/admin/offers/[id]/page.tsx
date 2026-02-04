'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfferForm from '@/components/admin/offers/OfferForm';

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [id, setId] = useState<string>('');

    useEffect(() => {
        const unwrapParams = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (id) {
            fetchOffer();
        }
    }, [id]);

    const fetchOffer = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const response = await fetch(`/api/admin/offers/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOffer(data.offer);
            } else if (response.status === 401) {
                window.location.href = '/admin/login';
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Ładowanie...</div>;
    }

    if (!offer) {
        return <div className="text-center py-8 text-red-500">Oferta nie znaleziona</div>;
    }

    return <OfferForm initialData={offer} />;
}
