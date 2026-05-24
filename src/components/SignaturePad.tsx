'use client';

import { useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onSave: (signatureData: string, metadata: SignatureMetadata) => void;
    onCancel: () => void;
}

interface SignatureMetadata {
    timestamp: string;
    ip?: string;
    userAgent: string;
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
    const [agreed, setAgreed] = useState(false);

    const handleSave = async () => {
        if (!signaturePad || signaturePad.isEmpty()) {
            alert('Proszę złożyć podpis');
            return;
        }

        if (!agreed) {
            alert('Proszę zaakceptować warunki umowy');
            return;
        }

        const signatureData = signaturePad.toDataURL('image/png');

        const metadata: SignatureMetadata = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        onSave(signatureData, metadata);
    };

    const handleClear = () => {
        signaturePad?.clear();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Podpisz Umowę</h2>
                <p className="text-gray-600 mb-6">
                    Złóż podpis poniżej, aby zaakceptować warunki umowy
                </p>

                {/* Signature Canvas */}
                <div className="border-2 border-gray-300 rounded-xl mb-6 bg-gray-50">
                    <SignatureCanvas
                        ref={(ref) => setSignaturePad(ref)}
                        canvasProps={{
                            className: 'w-full h-64 cursor-crosshair',
                        }}
                        backgroundColor="rgb(249, 250, 251)"
                    />
                </div>

                {/* Terms Acceptance */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                            Oświadczam, że przeczytałem/am i akceptuję wszystkie warunki wymienione w umowie.
                            Rozumiem, że podpis cyfrowy ma taką samą moc prawną jak podpis własnoręczny.
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClear}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                        Wyczyść
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!agreed}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold transition-colors shadow-lg"
                    >
                        ✓ Podpisz i Zatwierdź
                    </button>
                </div>

                {/* Legal Info */}
                <p className="mt-4 text-xs text-gray-500 text-center">
                    Podpis zostanie zabezpieczony wraz z danymi: data i godzina ({new Date().toLocaleString('pl-PL')}),
                    adres IP, identyfikator przeglądarki
                </p>
            </div>
        </div>
    );
}
