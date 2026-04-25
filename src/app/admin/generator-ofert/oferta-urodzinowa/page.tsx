'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Mail, Copy, Check, AlertCircle } from 'lucide-react';
import BirthdayOfferTemplate from '@/components/admin/BirthdayOfferTemplate';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
}

export default function BirthdayOfferPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (showClientList) {
      fetchClients();
    }
  }, [showClientList, search]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const url = `/api/admin/clients${
        search ? `?search=${encodeURIComponent(search)}` : ''
      }`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientList(false);
  };

  const handleSaveOffer = async (data: any) => {
    setOfferData(data);
    console.log('Offer saved:', data);
    // TODO: Save to database
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download using react-pdf
    console.log('Downloading PDF...');
  };

  const handleSendEmail = async () => {
    if (!selectedClient?.email) {
      alert('Klient nie ma adresu email');
      return;
    }
    // TODO: Send email with offer
    console.log('Sending email to:', selectedClient.email);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/oferta/${selectedClient?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 mb-2">
            🎂 Generator Ofert Urodzinowych
          </h1>
          <p className="text-gray-600">
            Twórz profesjonalne, edytowalne oferty dla swoich klientów
          </p>
        </motion.div>

        {/* Client Selection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-amber-500"
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wybierz klienta
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowClientList(!showClientList)}
                  className="w-full md:w-80 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white hover:border-amber-500 transition text-left font-semibold"
                >
                  {selectedClient
                    ? `${selectedClient.firstName} ${selectedClient.lastName}`
                    : 'Kliknij aby wybrać klienta'}
                </button>

                {showClientList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-500 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
                  >
                    <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                      <input
                        type="text"
                        placeholder="Szukaj klienta..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {clients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Brak klientów
                      </div>
                    ) : (
                      clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 transition"
                        >
                          <p className="font-semibold text-gray-900">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.email || 'brak email'}
                          </p>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data imprezy
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
              />
            </div>

            {selectedClient && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-2 flex-wrap md:flex-nowrap"
              >
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                  title="Pobierz ofertę jako PDF"
                >
                  <Download size={20} />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                  title="Wyślij ofertę mailem"
                >
                  <Mail size={20} />
                  <span className="hidden sm:inline">Mail</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                  title="Skopiuj link do oferty"
                >
                  {copied ? (
                    <Check size={20} />
                  ) : (
                    <Copy size={20} />
                  )}
                  <span className="hidden sm:inline">
                    {copied ? 'Skopiowano' : 'Link'}
                  </span>
                </button>
              </motion.div>
            )}
          </div>

          {!selectedClient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded flex items-start gap-3"
            >
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Wybierz klienta aby rozpocząć tworzenie oferty
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Offer Template */}
        {selectedClient && (
          <BirthdayOfferTemplate
            clientName={`${selectedClient.firstName} ${selectedClient.lastName}`}
            eventDate={eventDate}
            onSave={handleSaveOffer}
          />
        )}
      </div>
    </div>
  );
}
