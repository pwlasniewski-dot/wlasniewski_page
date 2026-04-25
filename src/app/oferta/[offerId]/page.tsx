'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Heart, CheckCircle } from 'lucide-react';
import BirthdayOfferTemplate from '@/components/admin/BirthdayOfferTemplate';

interface OfferPreviewProps {
  params: {
    offerId: string;
  };
}

export default function OfferPreviewPage({ params }: OfferPreviewProps) {
  const [offerData, setOfferData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // TODO: Fetch offer data from API
    fetchOffer();
  }, [params.offerId]);

  const fetchOffer = async () => {
    try {
      // const res = await fetch(`/api/offers/${params.offerId}`);
      // if (res.ok) {
      //   const data = await res.json();
      //   setOfferData(data);
      // }
      
      // Mock data for demo
      setOfferData({
        clientName: 'Kowalski Jan',
        eventDate: '2026-05-15',
        travelDistance: 15,
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
        />
      </div>
    );
  }

  if (!offerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xl font-bold text-gray-900 mb-2">
            Oferta nie znaleziona
          </p>
          <p className="text-gray-600">Przepraszamy, ta oferta nie istnieje</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Client Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Oferta fotograficzna
            </h2>
            <p className="text-sm text-gray-600">
              Przejrzyj i zaakceptuj ofertę
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                liked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              Polub
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
              <Share2 size={20} />
              Udostępnij
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition font-semibold">
              <Download size={20} />
              PDF
            </button>

            {!accepted && (
              <button
                onClick={() => setAccepted(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition font-semibold"
              >
                <CheckCircle size={20} />
                Akceptuję
              </button>
            )}

            {accepted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold"
              >
                <CheckCircle size={20} />
                Zaakceptowana
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Offer Template Preview */}
      <BirthdayOfferTemplate
        clientName={offerData.clientName}
        eventDate={offerData.eventDate}
      />

      {/* Acceptance Section */}
      {accepted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto px-4 py-12"
        >
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-300 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={32} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Dziękujemy za akceptację!
            </h3>
            <p className="text-green-700 mb-4">
              Twoja oferta została zaakceptowana. Wkrótce skontaktujemy się z Tobą
              w celu finalizacji szczegółów.
            </p>
            <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition">
              Wróć do konta
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
