/**
 * Foto-Match: AWS Rekognition moderacja zdjęć.
 *
 * Wywołanie: detectModeration(imageBuffer)
 * Zwraca: { status: 'APPROVED' | 'FLAGGED', labels: [...], flaggedFor: string|null }
 *
 * Status:
 *   APPROVED — żaden problem (lub MinConfidence < 70%).
 *   FLAGGED  — wykryto Explicit Nudity / Suggestive / Violence / Visually Disturbing
 *              z confidence ≥ 70%. Zdjęcie blokowane do manualnego review.
 *
 * Koszt: ~$0.001 per obraz (pierwsze 5M/miesiąc; potem $0.0008).
 *
 * Wymaga uprawnień IAM dla klucza S3:
 *   "rekognition:DetectModerationLabels" na *.
 */
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

const accessKeyId = (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim();
// Rekognition NIE jest dostępny w eu-north-1 (Stockholm) — używamy eu-west-1 (Ireland).
// Override przez REKOGNITION_REGION jeśli kiedyś AWS udostępni w innym regionie.
const region = (process.env.REKOGNITION_REGION || 'eu-west-1').trim();

let client: RekognitionClient | null = null;
function getClient(): RekognitionClient {
    if (!client) {
        client = new RekognitionClient({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
    }
    return client;
}

// Kategorie blokujące. Wszystko inne = warning, ale nie blokujemy.
const BLOCKING_CATEGORIES = new Set([
    'Explicit Nudity',
    'Nudity',
    'Graphic Male Nudity',
    'Graphic Female Nudity',
    'Sexual Activity',
    'Illustrated Explicit Nudity',
    'Adult Toys',
    'Violence',
    'Graphic Violence Or Gore',
    'Physical Violence',
    'Weapon Violence',
    'Self Injury',
    'Hate Symbols',
    'Drug Use',
    'Drugs',
]);

const MIN_CONFIDENCE = 70; // %

export type ModerationLabel = {
    name: string;
    confidence: number;
    parentName?: string;
};

export type ModerationResult = {
    status: 'APPROVED' | 'FLAGGED' | 'ERROR';
    labels: ModerationLabel[];
    flaggedFor: string | null;
    error?: string;
};

/**
 * Skanuje obraz; jeśli AWS niedostępny — zwraca FLAGGED + ERROR żeby admin
 * ręcznie zaakceptował (failsafe — nie wpuszczamy bez sprawdzenia).
 */
export async function detectModeration(imageBuffer: Buffer): Promise<ModerationResult> {
    if (!accessKeyId || !secretAccessKey) {
        return {
            status: 'FLAGGED',
            labels: [],
            flaggedFor: null,
            error: 'AWS_CREDENTIALS_MISSING',
        };
    }

    try {
        const cmd = new DetectModerationLabelsCommand({
            Image: { Bytes: imageBuffer },
            MinConfidence: MIN_CONFIDENCE,
        });
        const resp = await getClient().send(cmd);

        const labels: ModerationLabel[] = (resp.ModerationLabels || []).map((l) => ({
            name: l.Name || '',
            confidence: l.Confidence || 0,
            parentName: l.ParentName || undefined,
        }));

        const blocking = labels.find((l) => BLOCKING_CATEGORIES.has(l.name));

        if (blocking) {
            return {
                status: 'FLAGGED',
                labels,
                flaggedFor: blocking.name,
            };
        }
        return {
            status: 'APPROVED',
            labels,
            flaggedFor: null,
        };
    } catch (err: any) {
        console.error('[FOTO_MATCH_MODERATION] ERROR:', err.message);
        // Failsafe: traktuj jak FLAGGED, admin ręcznie zaakceptuje
        return {
            status: 'FLAGGED',
            labels: [],
            flaggedFor: null,
            error: err.message || 'REKOGNITION_ERROR',
        };
    }
}
