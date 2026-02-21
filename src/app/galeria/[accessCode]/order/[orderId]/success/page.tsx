'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params.accessCode as string;
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch order status
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/galleries/${accessCode}/order/${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data.order);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [accessCode, orderId]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">
                    Dziękujemy za zamówienie!
                </h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Twoje zamówienie zostało przyjęte i opłacone. <br />
                    Fotograf wyślę Ci dostęp do zdjęć na podany adres e-mail.
                </p>

                {!loading && order && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-left space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Nr zamówienia</span>
                            <span className="text-white font-mono">#{order.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Zdjęcia</span>
                            <span className="text-white">{order.photo_count} szt.</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-zinc-800 pt-3">
                            <span className="text-zinc-500">Zapłacono</span>
                            <span className="text-green-400 font-bold">
                                {order.payment_status === 'paid' ? `${(order.total_amount / 100).toFixed(2)} PLN` : 'Oczekuje na potwierdzenie PayU'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Link
                        href={`/galeria/${accessCode}`}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 border border-zinc-700 hover:border-gold-500 text-white rounded-2xl transition-all font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Wróć do galerii
                    </Link>
                    <Link
                        href="/konto"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gold-600 hover:bg-gold-500 text-black rounded-2xl transition-all font-bold"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Historia zamówień
                    </Link>
                </div>
            </div>
        </div>
    );
}
