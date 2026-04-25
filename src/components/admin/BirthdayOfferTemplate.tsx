'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Download, Edit2, Save, X, Plus, Upload, Eye, EyeOff } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  photos: number;
  prints: number;
  video?: string;
  features: string[];
  highlighted?: boolean;
}

interface OfferTemplateProps {
  clientName?: string;
  eventDate?: string;
  onSave?: (offerData: any) => void;
}

const defaultPackages: Package[] = [
  {
    id: 'economic',
    name: 'Pakiet Ekonomiczny',
    price: 870,
    duration: '4 godziny',
    photos: 150,
    prints: 50,
    features: ['Galeria online', 'Pendrive z zdjęciami'],
  },
  {
    id: 'photo',
    name: 'Pakiet Foto',
    price: 1190,
    duration: '6 godzin',
    photos: 200,
    prints: 50,
    features: ['Galeria online', 'Pendrive z zdjęciami'],
  },
  {
    id: 'standard',
    name: 'Pakiet Standard',
    price: 1350,
    duration: '4 godziny',
    photos: 150,
    prints: 50,
    video: 'do 10 minut',
    features: ['Filmik HD', 'Galeria online', 'Pendrive z materiałami'],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Pakiet Premium',
    price: 1700,
    duration: '6 godzin',
    photos: 200,
    prints: 50,
    video: 'do 15 minut',
    features: ['Filmik HD', 'Galeria online', 'Pendrive z materiałami'],
  },
];

export default function BirthdayOfferTemplate({
  clientName = 'Klient',
  eventDate = new Date().toISOString().split('T')[0],
  onSave,
}: OfferTemplateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [formData, setFormData] = useState({
    clientName,
    eventDate,
    travelDistance: 10,
    notes: '',
  });

  const handlePackageUpdate = (id: string, updates: Partial<Package>) => {
    setPackages(packages.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            setPreviewImages(prev => [...prev, event.target?.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = (pkg: Package) => {
    const travelCost = Math.max(0, (formData.travelDistance - 10) * 1.5);
    return pkg.price + travelCost;
  };

  const handleSave = () => {
    const offerData = {
      clientName: formData.clientName,
      eventDate: formData.eventDate,
      packages,
      images: previewImages,
      travelDistance: formData.travelDistance,
      notes: formData.notes,
    };
    onSave?.(offerData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 mb-2">
              📸 Oferta Fotograficzna
            </h1>
            <p className="text-gray-600">Imprezy Urodzinowe 2026</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
            >
              {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
              {showPreview ? 'Ukryj' : 'Pokaż'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition"
            >
              {isEditing ? <X size={20} /> : <Edit2 size={20} />}
              {isEditing ? 'Anuluj' : 'Edytuj'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
              >
                <Save size={20} />
                Zapisz
              </button>
            )}
          </div>
        </div>

        {/* Client Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md border-l-4 border-amber-500 mb-8"
        >
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Imię i nazwisko klienta
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data imprezy
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dystans dojazdu (km)
                </label>
                <input
                  type="number"
                  value={formData.travelDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      travelDistance: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">
                  Klient
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formData.clientName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">
                  Data imprezy
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(formData.eventDate).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">
                  Dystans
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formData.travelDistance} km
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Gallery Preview Section */}
            {previewImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  🖼️ Przykładowe prace z albumów
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {previewImages.map((img, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-lg overflow-hidden shadow-lg"
                    >
                      <img
                        src={img}
                        alt={`Preview ${idx}`}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Image Upload Section (Edit Mode) */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 bg-white rounded-xl p-8 shadow-md border-2 border-dashed border-amber-300"
              >
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-12 h-12 text-amber-500 mb-2" />
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    Dodaj zdjęcia albumów
                  </p>
                  <p className="text-sm text-gray-500">
                    Kliknij aby wybrać zdjęcia lub przeciągnij je tutaj
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </motion.div>
            )}

            {/* Packages Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                📦 Dostępne pakiety
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg, idx) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                      pkg.highlighted
                        ? 'ring-2 ring-amber-500 scale-105 md:col-span-2 md:w-1/2 md:mx-auto'
                        : 'bg-white'
                    } ${isEditing ? 'border-2 border-gray-200' : ''}`}
                  >
                    {/* Highlight Badge */}
                    {pkg.highlighted && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 text-center font-bold text-sm">
                        ⭐ POLECANY PAKIET
                      </div>
                    )}

                    <div className={`p-8 ${pkg.highlighted ? 'pt-16' : ''}`}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) =>
                            handlePackageUpdate(pkg.id, { name: e.target.value })
                          }
                          className="text-2xl font-bold text-gray-900 w-full mb-4 border-b-2 border-gray-300 pb-2"
                        />
                      ) : (
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {pkg.name}
                        </h3>
                      )}

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">⏱️ Czas pracy:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={pkg.duration}
                              onChange={(e) =>
                                handlePackageUpdate(pkg.id, {
                                  duration: e.target.value,
                                })
                              }
                              className="border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {pkg.duration}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">📷 Zdjęcia:</span>
                          {isEditing ? (
                            <input
                              type="number"
                              value={pkg.photos}
                              onChange={(e) =>
                                handlePackageUpdate(pkg.id, {
                                  photos: parseInt(e.target.value),
                                })
                              }
                              className="border border-gray-300 rounded px-2 py-1 w-20"
                            />
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {pkg.photos}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">🖨️ Odbitki:</span>
                          {isEditing ? (
                            <input
                              type="number"
                              value={pkg.prints}
                              onChange={(e) =>
                                handlePackageUpdate(pkg.id, {
                                  prints: parseInt(e.target.value),
                                })
                              }
                              className="border border-gray-300 rounded px-2 py-1 w-20"
                            />
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {pkg.prints}
                            </span>
                          )}
                        </div>

                        {pkg.video && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">🎬 Filmik:</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={pkg.video}
                                onChange={(e) =>
                                  handlePackageUpdate(pkg.id, {
                                    video: e.target.value,
                                  })
                                }
                                className="border border-gray-300 rounded px-2 py-1"
                              />
                            ) : (
                              <span className="font-semibold text-gray-900">
                                {pkg.video}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-600 mb-2">
                          ✓ Co zawiera pakiet:
                        </p>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, fidx) => (
                            <li
                              key={fidx}
                              className="text-gray-700 flex items-center gap-2"
                            >
                              <span className="text-amber-500">•</span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={feature}
                                  onChange={(e) => {
                                    const newFeatures = [...pkg.features];
                                    newFeatures[fidx] = e.target.value;
                                    handlePackageUpdate(pkg.id, {
                                      features: newFeatures,
                                    });
                                  }}
                                  className="border border-gray-300 rounded px-2 py-1 flex-1"
                                />
                              ) : (
                                feature
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Price */}
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg mb-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-gray-600">Cena pakietu:</span>
                          {isEditing ? (
                            <input
                              type="number"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePackageUpdate(pkg.id, {
                                  price: parseFloat(e.target.value),
                                })
                              }
                              className="border border-gray-300 rounded px-2 py-1 w-32 text-right font-bold"
                            />
                          ) : (
                            <span className="text-3xl font-bold text-amber-700">
                              {pkg.price} zł
                            </span>
                          )}
                        </div>
                        {formData.travelDistance > 10 && (
                          <div className="text-sm text-gray-600 mt-2 border-t border-amber-200 pt-2">
                            <p>
                              Dojazd: {(formData.travelDistance - 10) * 1.5} zł
                            </p>
                            <p className="font-bold text-amber-700">
                              Razem: {calculateTotal(pkg)} zł
                            </p>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => {
                            handlePackageUpdate(pkg.id, {
                              highlighted: !pkg.highlighted,
                            });
                          }}
                          className={`w-full py-2 rounded-lg font-semibold transition ${
                            pkg.highlighted
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {pkg.highlighted
                            ? '⭐ Pakiet polecany'
                            : 'Ustaw jako polecany'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Notes Section */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto mb-12"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Dodatkowe notatki/Warunki
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Dodaj dodatkowe warunki, informacje lub szczegóły..."
                />
              </motion.div>
            )}

            {/* Footer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 shadow-md mb-12"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ℹ️ Informacje dodatkowe
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  • <span className="font-semibold">Dojazd:</span> powyżej 10 km
                  - 1,5 zł za km
                </p>
                <p>
                  • <span className="font-semibold">Zaliczka:</span> 30% kwoty
                  bezzwrotnej w przypadku rezygnacji ze strony klienta
                </p>
                <p>
                  • <span className="font-semibold">Ważność oferty:</span> 30 dni
                  od daty przekazania
                </p>
                <p>
                  • <span className="font-semibold">Zakres:</span> wyłącznie
                  imprezy urodzinowe
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-xl">
                <Download size={20} />
                Pobierz PDF
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-xl">
                📧 Wyślij mailowo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
