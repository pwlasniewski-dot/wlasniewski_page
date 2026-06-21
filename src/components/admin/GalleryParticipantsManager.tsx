'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, Check, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Image as ImageIcon, Download, Package, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Participant {
  id: number;
  participant_code: string | null;
  parent_identifier: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectionsMap, setSelectionsMap] = useState<Record<number, { loading: boolean; photos: Array<{ photo_id: number; file_url: string; thumbnail_url: string | null; selected_at: string }> }>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedReminderIds, setSelectedReminderIds] = useState<Set<number>>(new Set());
  const [deadlineDate, setDeadlineDate] = useState('');
  const [fallbackGroupPhotos, setFallbackGroupPhotos] = useState(3);
  const [sendingReminder, setSendingReminder] = useState(false);

  const toggleExpand = async (participantId: number) => {
    if (expandedId === participantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(participantId);
    if (!selectionsMap[participantId]) {
      setSelectionsMap(prev => ({ ...prev, [participantId]: { loading: true, photos: [] } }));
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/galleries/${galleryId}/participants/${participantId}/selections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSelectionsMap(prev => ({
            ...prev,
            [participantId]: { loading: false, photos: data.selections || [] },
          }));
        } else {
          setSelectionsMap(prev => ({ ...prev, [participantId]: { loading: false, photos: [] } }));
          toast.error('Nie udało się pobrać wyborów');
        }
      } catch (error) {
        console.error('Load selections error:', error);
        setSelectionsMap(prev => ({ ...prev, [participantId]: { loading: false, photos: [] } }));
      }
    }
  };

  useEffect(() => {
    fetchGalleryInfo();
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]);

  useEffect(() => {
    if (deadlineDate) return;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    setDeadlineDate(deadline.toISOString().slice(0, 10));
  }, [deadlineDate]);

  const fetchGalleryInfo = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/galleries/${galleryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const g = data.gallery || data; // backward-compat
        setGalleryInfo({
          id: g.id,
          gallery_mode: g.gallery_mode || 'INDIVIDUAL',
          group_access_code: g.group_access_code,
          group_password: g.group_password,
          max_photos_for_print: g.max_photos_for_print,
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
        const items = data.participants || [];
        setParticipants(items);
        const initialReminderIds = items
          .filter((p: Participant) => p.selections_count === 0 && !!p.parent_email)
          .map((p: Participant) => p.id);
        setSelectedReminderIds(new Set(initialReminderIds));
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

  const downloadWithAuth = async (url: string, fallbackName: string) => {
    const toastId = toast.loading('Przygotowywanie pliku...');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        toast.error('Nie udało się pobrać pliku', { id: toastId });
        return;
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const utf8Match = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const plainMatch = cd.match(/filename="([^"]+)"/i);
      const name = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : plainMatch?.[1] || fallbackName;
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success('Pobrano', { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Błąd pobierania', { id: toastId });
    }
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

  const toggleReminderRecipient = (participantId: number) => {
    setSelectedReminderIds(prev => {
      const next = new Set(prev);
      if (next.has(participantId)) next.delete(participantId);
      else next.add(participantId);
      return next;
    });
  };

  const selectNoSelectionWithEmail = () => {
    const ids = participants
      .filter(p => p.selections_count === 0 && !!p.parent_email)
      .map(p => p.id);
    setSelectedReminderIds(new Set(ids));
  };

  const selectAllWithEmail = () => {
    const ids = participants
      .filter(p => !!p.parent_email)
      .map(p => p.id);
    setSelectedReminderIds(new Set(ids));
  };

  const clearReminderSelection = () => {
    setSelectedReminderIds(new Set());
  };

  const sendReminder = async () => {
    if (selectedReminderIds.size === 0) {
      toast.error('Zaznacz przynajmniej jednego opiekuna z emailem');
      return;
    }
    if (!deadlineDate) {
      toast.error('Ustaw termin ostateczny');
      return;
    }

    const toastId = toast.loading('Wysyłanie monitu...');
    setSendingReminder(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/galleries/${galleryId}/participants/remind`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: Array.from(selectedReminderIds),
          deadlineDate,
          fallbackGroupPhotos,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.error || 'Nie udało się wysłać monitu', { id: toastId });
        return;
      }

      toast.success(`Monit wysłany: ${data.sentCount}/${data.requestedCount}`, { id: toastId });
      if (Array.isArray(data.skipped) && data.skipped.length > 0) {
        toast(`Pominięto ${data.skipped.length} pozycji bez maila`, { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Send reminder error:', error);
      toast.error('Błąd wysyłki monitu', { id: toastId });
    } finally {
      setSendingReminder(false);
    }
  };

  const participantsWithSelections = participants.filter(p => p.selections_count > 0).length;
  const participantsWithoutSelections = participants.length - participantsWithSelections;
  const participantsWithEmail = participants.filter(p => !!p.parent_email).length;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Wybrali zdjęcia</p>
                <p className="text-xl font-black text-green-400">{participantsWithSelections}</p>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Nie wybrali</p>
                <p className="text-xl font-black text-amber-300">{participantsWithoutSelections}</p>
              </div>
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Mają email</p>
                <p className="text-xl font-black text-blue-300">{participantsWithEmail}</p>
              </div>
            </div>

            <div className="mb-4 bg-black/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectNoSelectionWithEmail}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-bold"
                >
                  Zaznacz: bez wyboru + email
                </button>
                <button
                  type="button"
                  onClick={selectAllWithEmail}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-bold"
                >
                  Zaznacz: wszyscy z emailem
                </button>
                <button
                  type="button"
                  onClick={clearReminderSelection}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Wyczyść zaznaczenie
                </button>
                <span className="text-xs text-zinc-400 ml-auto">
                  Do monitu: <strong className="text-white">{selectedReminderIds.size}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Termin ostateczny wyboru</label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Fallback po terminie</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={fallbackGroupPhotos}
                    onChange={(e) => setFallbackGroupPhotos(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Jeśli brak wyboru: wybierasz {fallbackGroupPhotos} zdjęcia grupowe ogólne.</p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={sendReminder}
                    disabled={sendingReminder || selectedReminderIds.size === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-black disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sendingReminder ? 'Wysyłanie...' : 'Wyślij monit z terminem'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-zinc-400">
                <strong className="text-white">{participants.length}</strong> {participants.length === 1 ? 'rodzic zarejestrowany' : 'rodziców zarejestrowanych'}
              </p>
              {participants.some(p => p.selections_count > 0) && (
                <button
                  type="button"
                  onClick={() => downloadWithAuth(
                    `/api/admin/galleries/${galleryId}/participants/download-all?layout=nphoto`,
                    'nphoto-wszyscy-rodzice-pelny-rozmiar.zip'
                  )}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold rounded-lg transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Pobierz do Nphoto (wszyscy, pelny rozmiar)
                </button>
              )}
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Żaden rodzic się jeszcze nie zarejestrował</p>
                <p className="text-zinc-600 text-xs mt-2">Udostępnij kod dostępu rodzicom</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {participants.map(participant => {
                  const isExpanded = expandedId === participant.id;
                  const sel = selectionsMap[participant.id];
                  return (
                  <div key={participant.id} className="bg-black/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between p-4">
                      <button
                        type="button"
                        onClick={() => toggleExpand(participant.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
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
                          {(participant.parent_email || participant.parent_phone) && (
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-500">
                              {participant.parent_email && (
                                <span className="flex items-center gap-1">
                                  ✉️ <span className="text-zinc-300">{participant.parent_email}</span>
                                </span>
                              )}
                              {participant.parent_phone && (
                                <span className="flex items-center gap-1">
                                  📞 <span className="text-zinc-300">{participant.parent_phone}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                          <ImageIcon className="w-4 h-4" />
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="ml-2 p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!participant.parent_email}
                        onClick={() => toggleReminderRecipient(participant.id)}
                        className={`ml-2 p-2 rounded-lg border transition-colors ${!participant.parent_email
                          ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                          : selectedReminderIds.has(participant.id)
                            ? 'border-gold-500/50 text-gold-300 bg-gold-500/10 hover:bg-gold-500/20'
                            : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        title={!participant.parent_email ? 'Brak emaila opiekuna' : (selectedReminderIds.has(participant.id) ? 'Usuń z monitu' : 'Dodaj do monitu')}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-zinc-800 bg-zinc-950/50 p-4">
                        {sel?.loading ? (
                          <p className="text-xs text-zinc-500">Ładowanie wybranych zdjęć...</p>
                        ) : sel && sel.photos.length === 0 ? (
                          <p className="text-xs text-zinc-500">Ten rodzic nie wybrał jeszcze żadnych zdjęć.</p>
                        ) : sel ? (
                          <div>
                            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                              <p className="text-xs text-zinc-400">
                                Wybrane zdjęcia do druku ({sel.photos.length}):
                              </p>
                              <button
                                type="button"
                                onClick={() => downloadWithAuth(
                                  `/api/admin/galleries/${galleryId}/participants/${participant.id}/download-all`,
                                  `${(participant.parent_name || 'Klient').trim() || 'Klient'} wybrane zdjecia.zip`
                                )}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold rounded-lg transition-colors"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Pobierz wszystkie (ZIP)
                              </button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                              {sel.photos.map((p, idx) => (
                                <div
                                  key={p.photo_id}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-gold-500 transition-colors group"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setLightboxUrl(p.file_url)}
                                    className="absolute inset-0"
                                    title={`Podgląd zdjęcia #${p.photo_id}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={p.thumbnail_url || p.file_url}
                                      alt={`Wybór ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </button>
                                  <span className="absolute top-1 left-1 bg-gold-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                                    {idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadWithAuth(
                                        `/api/admin/galleries/${galleryId}/participants/${participant.id}/download/${p.photo_id}?index=${idx + 1}`,
                                        `${participant.parent_identifier || 'rodzic'}_${String(idx + 1).padStart(2, '0')}.jpg`
                                      );
                                    }}
                                    className="absolute bottom-1 right-1 p-1.5 bg-black/80 hover:bg-gold-500 hover:text-black text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Pobierz w pełnej rozdzielczości"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  );
                })}
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

      {/* Lightbox podgląd zdjęcia */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[60]"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Podgląd"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full flex items-center justify-center"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
