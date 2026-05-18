'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Participant {
  id: number;
  participant_code: string | null;
  parent_identifier: string | null;
  parent_name: string | null;
  avatar: string | null;
  name: string;
  max_selections: number;
  publication_consent: boolean;
  consent_scope: string | null;
  consent_given_at: string | null;
  selections_count: number;
}

interface GalleryInfo {
  id: number;
  gallery_mode: string;
  group_access_code: string | null;
  group_password: string | null;
  max_photos_for_print: number | null;
}

interface GalleryParticipantsManagerProps {
  galleryId: number;
}

export default function GalleryParticipantsManager({ galleryId }: GalleryParticipantsManagerProps) {
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchGalleryInfo();
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]);

  const fetchGalleryInfo = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/galleries/${galleryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGalleryInfo({
          id: data.id,
          gallery_mode: data.gallery_mode || 'INDIVIDUAL',
          group_access_code: data.group_access_code,
          group_password: data.group_password,
          max_photos_for_print: data.max_photos_for_print,
        });
      }
    } catch (error) {
      console.error('Fetch gallery info error:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/galleries/${galleryId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Fetch participants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} skopiowano`);
  };

  const handleDeleteParticipant = async (participantId: number) => {
    if (!confirm('Czy na pewno usunąć uczestnika?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/galleries/${galleryId}/participants/${participantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Uczestnik usunięty');
        fetchParticipants();
      } else {
        toast.error('Nie udało się usunąć uczestnika');
      }
    } catch (error) {
      console.error('Delete participant error:', error);
      toast.error('Wystąpił błąd');
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
        <p className="text-zinc-400">Ładowanie...</p>
      </div>
    );
  }

  if (!galleryInfo) {
    return null;
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
      <h3 className="text-xs font-black text-gold-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <div className="p-2 bg-gold-500/10 rounded-lg">
          <Users className="w-4 h-4" />
        </div>
        Uczestnicy {galleryInfo.gallery_mode === 'GROUP' ? '(Tryb Grupowy)' : '(Tryb Indywidualny)'}
      </h3>

      {/* GROUP MODE */}
      {galleryInfo.gallery_mode === 'GROUP' && (
        <div className="space-y-6">
          {/* Access Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/50 border border-zinc-800 rounded-xl p-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Kod Dostępu</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-gold-500 font-mono text-lg">
                  {galleryInfo.group_access_code || 'BRAK'}
                </code>
                <button
                  onClick={() => galleryInfo.group_access_code && copyToClipboard(galleryInfo.group_access_code, 'Kod')}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Hasło</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-lg">
                  {showPassword ? (galleryInfo.group_password || 'BRAK') : '••••••'}
                </code>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                </button>
                {galleryInfo.group_password && (
                  <button
                    onClick={() => copyToClipboard(galleryInfo.group_password!, 'Hasło')}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Link dla rodziców</label>
              <p className="text-xs text-amber-400/80 mb-2">⚠️ Hasło NIE jest dołączane do linku (RODO) - przekaż je osobno</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-blue-400 font-mono text-sm">
                  {typeof window !== 'undefined' && `${window.location.origin}/galeria/grupowa?code=${galleryInfo.group_access_code}`}
                </code>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/galeria/grupowa?code=${galleryInfo.group_access_code}`;
                    copyToClipboard(link, 'Link');
                  }}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-zinc-400">
                <strong className="text-white">{participants.length}</strong> {participants.length === 1 ? 'rodzic zarejestrowany' : 'rodziców zarejestrowanych'}
              </p>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Żaden rodzic się jeszcze nie zarejestrował</p>
                <p className="text-zinc-600 text-xs mt-2">Udostępnij kod dostępu rodzicom</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {participants.map(participant => (
                  <div key={participant.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-3">
                        {participant.avatar && (
                          <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                            {participant.avatar}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-gold-500 font-bold">
                              {participant.parent_identifier}
                            </span>
                            <span className="text-white font-medium">
                              {participant.parent_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>
                              Wybrano: <strong className="text-white">{participant.selections_count}/{participant.max_selections}</strong>
                            </span>
                            {participant.publication_consent ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Zgoda: {participant.consent_scope === 'ALL' ? 'wszystkie' : 'wybrane'}
                              </span>
                            ) : (
                              <span className="text-amber-400">Brak zgody</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INDIVIDUAL MODE */}
      {galleryInfo.gallery_mode === 'INDIVIDUAL' && (
        <div className="space-y-4">
          {participants.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
              <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Brak uczestników</p>
              <p className="text-zinc-600 text-xs mt-2">Użyj starszego interfejsu do dodawania kodów</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {participants.map(participant => (
                <div key={participant.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{participant.name}</span>
                    <button
                      onClick={() => participant.participant_code && copyToClipboard(participant.participant_code, 'Kod')}
                      className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3 text-zinc-500" />
                    </button>
                  </div>
                  <code className="text-xs font-mono text-gold-500 bg-zinc-900 px-2 py-1 rounded">
                    {participant.participant_code}
                  </code>
                  <div className="mt-2 text-xs text-zinc-400">
                    {participant.selections_count}/{participant.max_selections} wybranych
                    {participant.publication_consent && (
                      <span className="text-green-400 ml-2">✓ Zgoda</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
