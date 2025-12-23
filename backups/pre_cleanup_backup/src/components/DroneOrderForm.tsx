'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function DroneOrderForm() {
  const [formData, setFormData] = useState({
    client_name: '',
    company_name: '',
    email: '',
    phone: '',
    service_type: '',
    details: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  const services = [
    { value: 'fotowoltaika', label: '🔋 Fotowoltaika - Kontrola paneli i połączeń' },
    { value: 'inspekcja_dachu', label: '🏗️ Inspekcje Dachów - Uszkodzenia i nieszczelności' },
    { value: 'ciepłownictwo', label: '🌡️ Ciepłownictwo - Termowizja i zagrożenia' },
    { value: 'przemysl', label: '⚙️ Przemysł - Monitorowanie obiektów' },
    { value: 'ortofotomapy', label: '🗺️ Ortofotomapy - Mapy lotnicze terenu' },
    { value: 'nadzor_budowlany', label: '👷 Nadzór Budowlany - Postępy i stan budowy' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.client_name.trim()) return 'Imię i nazwisko jest wymagane';
    if (!formData.company_name.trim()) return 'Nazwa firmy jest wymagana';
    if (!formData.email.trim()) return 'Email jest wymagany';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Podaj prawidłowy adres email';
    if (!formData.phone.trim()) return 'Numer telefonu jest wymagany';
    if (!formData.service_type) return 'Wybierz typ usługi';
    if (!formData.details.trim()) return 'Szczegóły zapytania są wymagane';
    if (formData.details.trim().length < 20) return 'Szczegóły muszą mieć co najmniej 20 znaków';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const error = validateForm();
    if (error) {
      setStatus('error');
      setErrorMessage(error);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Submit to API
      const response = await fetch('/api/drone/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Nie udało się wysłać zapytania');
      }

      const data = await response.json();
      setOrderId(data.id);
      setStatus('success');

      // Track event in analytics
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'drone_order_submitted',
            page_path: '/dron',
            metadata: {
              service_type: formData.service_type,
              company_name: formData.company_name,
            },
          }),
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          client_name: '',
          company_name: '',
          email: '',
          phone: '',
          service_type: '',
          details: '',
        });
        setStatus('idle');
        setOrderId(null);
      }, 3000);

    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Nieznąd błąd podczas wysyłania');
    }
  };

  return (
    <div className="w-full">
      {status === 'success' && (
        <div className="mb-6 p-6 bg-green-950/30 border border-green-700/50 rounded-xl flex items-start gap-4">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-green-400 mb-1">Zapytanie wysłane!</h3>
            <p className="text-green-300 text-sm">
              Twój numer zlecenia: <span className="font-mono font-bold">#{orderId}</span>
              <br />
              Odezwiemy się do Ciebie w ciągu 24 godzin.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-6 bg-red-950/30 border border-red-700/50 rounded-xl flex items-start gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-red-400 mb-1">Błąd</h3>
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Imię i nazwisko</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Jan Kowalski"
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:border-yellow-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Nazwa firmy</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="ABC Sp. z o.o."
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:border-yellow-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jan@example.com"
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:border-yellow-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Numer telefonu</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+48 123 456 789"
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:border-yellow-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Typ usługi</label>
          <select
            name="service_type"
            value={formData.service_type}
            onChange={handleChange}
            disabled={status === 'loading'}
            className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white focus:border-yellow-500 outline-none transition-colors disabled:opacity-50"
          >
            <option value="">Wybierz usługę...</option>
            {services.map(service => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Szczegóły zapytania</label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder="Opisz swój projekt, lokalizację, zakres prac, specjalne wymagania..."
            rows={4}
            disabled={status === 'loading'}
            className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:border-yellow-500 outline-none transition-colors disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Min. 20 znaków, {formData.details.length} / 20
          </p>
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-600 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-yellow-900/20 flex items-center justify-center gap-2"
        >
          {status === 'loading' && (
            <>
              <Loader size={18} className="animate-spin" />
              Wysyłanie...
            </>
          )}
          {status !== 'loading' && 'Wyślij Zapytanie B2B'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Twoje dane będą przetwarzane wyłącznie w celu obsługi zapytania.
        </p>
      </form>
    </div>
  );
}
