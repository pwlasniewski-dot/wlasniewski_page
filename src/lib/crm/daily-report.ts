import prisma from '@/lib/db/prisma';

export type CrmDailySnapshot = {
    accounts: { created: number; welcomeSent: number; welcomeFailed: number };
    login: { success: number; failed: number; slow: number; p95Ms: number };
    offers: { sent: number; viewed: number; accepted: number; rejected: number; zeroPricePrevented: number };
    contracts: { sent: number; viewed: number; signed: number; failed: number };
    galleries: {
        sent: number;
        opened: number;
        failed: number;
        groupAccountsCreated: number;
        groupMagicLogins: number;
        groupSelectionsSubmitted: number;
        archiveRequested: number;
        archiveCreated: number;
        archiveReused: number;
        archiveReady: number;
        archiveFailed: number;
        archiveLinksIssued: number;
        externalLinksIssued: number;
    };
    incidents: { p0Open: number; p1Open: number; acknowledged: number; resolved: number };
};

function parseMetadata(value: string | null): Record<string, unknown> {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function percentile95(values: number[]) {
    const sorted = values.filter(Number.isFinite).filter(value => value >= 0).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return Math.round(sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] * 10) / 10;
}

function countActivity(counts: Map<string, number>, action: string) {
    return counts.get(action) || 0;
}

function incidentCount(rows: Array<{ reason_code: string; severity: string; status: string }>, predicate: (row: { reason_code: string; severity: string; status: string }) => boolean) {
    return rows.filter(predicate).length;
}

export async function buildCrmDailySnapshot(start: Date, end: Date): Promise<CrmDailySnapshot> {
    const [accountsCreated, activities, groupGalleryActivities, loginLogs, incidents, p0Open, p1Open, acknowledged, resolved] = await Promise.all([
        prisma.user.count({ where: { role: 'CLIENT', created_at: { gte: start, lt: end } } }),
        prisma.crmActivity.groupBy({
            by: ['action'],
            where: { created_at: { gte: start, lt: end } },
            _count: { _all: true },
        }),
        prisma.groupGalleryActivity.groupBy({
            by: ['action'],
            where: { created_at: { gte: start, lt: end } },
            _count: { _all: true },
        }),
        prisma.systemLog.findMany({
            where: { module: 'AUTH', created_at: { gte: start, lt: end } },
            select: { message: true, metadata: true },
        }),
        prisma.adminIncident.findMany({
            where: { occurred_at: { gte: start, lt: end } },
            select: { reason_code: true, severity: true, status: true },
        }),
        prisma.adminIncident.count({ where: { severity: 'P0', status: 'OPEN' } }),
        prisma.adminIncident.count({ where: { severity: 'P1', status: 'OPEN' } }),
        prisma.adminIncident.count({ where: { acknowledged_at: { gte: start, lt: end } } }),
        prisma.adminIncident.count({ where: { resolved_at: { gte: start, lt: end } } }),
    ]);
    const activityCounts = new Map(activities.map(row => [row.action, row._count._all]));
    const groupGalleryCounts = new Map(groupGalleryActivities.map(row => [row.action, row._count._all]));
    const loginTotalMs = loginLogs.map(row => Number(parseMetadata(row.metadata).total_ms)).filter(Number.isFinite);
    const loginFailures = loginLogs.filter(row => row.message.startsWith('CLIENT_LOGIN_FAIL')).length
        + incidentCount(incidents, row => ['RATE_LIMIT', 'INACTIVE', 'DELETED', 'RESET_REQUIRED', 'INVALID_ROLE'].includes(row.reason_code));
    const failedByReason = (prefix: string) => incidentCount(incidents, row => row.reason_code.startsWith(prefix));

    return {
        accounts: {
            created: accountsCreated,
            welcomeSent: countActivity(activityCounts, 'welcome_email_sent'),
            welcomeFailed: failedByReason('WELCOME_EMAIL_'),
        },
        login: {
            success: loginLogs.filter(row => row.message === 'CLIENT_LOGIN_SUCCESS').length,
            failed: loginFailures,
            slow: incidentCount(incidents, row => row.reason_code === 'SLOW_LOGIN'),
            p95Ms: percentile95(loginTotalMs),
        },
        offers: {
            sent: countActivity(activityCounts, 'offer_sent'),
            viewed: countActivity(activityCounts, 'offer_viewed'),
            accepted: countActivity(activityCounts, 'offer_accepted'),
            rejected: countActivity(activityCounts, 'offer_rejected'),
            zeroPricePrevented: incidentCount(incidents, row => row.reason_code === 'OFFER_ZERO_PRICE_PREVENTED'),
        },
        contracts: {
            sent: countActivity(activityCounts, 'contract_sent'),
            viewed: countActivity(activityCounts, 'contract_viewed'),
            signed: countActivity(activityCounts, 'contract_signed'),
            failed: failedByReason('CONTRACT_'),
        },
        galleries: {
            sent: countActivity(activityCounts, 'gallery_access_sent'),
            opened: countActivity(activityCounts, 'gallery_viewed'),
            failed: failedByReason('GALLERY_') + failedByReason('GROUP_'),
            groupAccountsCreated: countActivity(groupGalleryCounts, 'PARENT_ACCOUNT_CREATED'),
            groupMagicLogins: countActivity(groupGalleryCounts, 'MAGIC_LOGIN_VERIFIED'),
            groupSelectionsSubmitted: countActivity(groupGalleryCounts, 'SELECTION_SUBMITTED'),
            archiveRequested: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_REQUESTED'),
            archiveCreated: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_CREATED'),
            archiveReused: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_REUSED'),
            archiveReady: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_READY'),
            archiveFailed: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_FAILED')
                + countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_DISPATCH_FAILED'),
            archiveLinksIssued: countActivity(groupGalleryCounts, 'DOWNLOAD_ARCHIVE_LINK_ISSUED'),
            externalLinksIssued: countActivity(groupGalleryCounts, 'DOWNLOAD_EXTERNAL_LINK_ISSUED'),
        },
        incidents: {
            p0Open,
            p1Open,
            acknowledged,
            resolved,
        },
    };
}

function metric(label: string, value: number | string) {
    return `<td style="padding:9px;border:1px solid #e5e7eb"><div style="font-size:10px;color:#6b7280;text-transform:uppercase">${label}</div><div style="font-size:19px;font-weight:700;margin-top:3px">${value}</div></td>`;
}

export function renderCrmDailyHtml(snapshot: CrmDailySnapshot) {
    return `<h2 style="font-size:20px;margin:30px 0 12px">CRM i obsługa klienta — ostatnia doba</h2>
    <table style="width:100%;border-collapse:collapse"><tr>
      ${metric('Nowe konta', snapshot.accounts.created)}${metric('Welcome wysłane', snapshot.accounts.welcomeSent)}${metric('Welcome błędy', snapshot.accounts.welcomeFailed)}${metric('Login sukces', snapshot.login.success)}
    </tr><tr>
      ${metric('Login błędy', snapshot.login.failed)}${metric('Login wolny', snapshot.login.slow)}${metric('Login p95', `${snapshot.login.p95Ms} ms`)}${metric('Cena 0 zablokowana', snapshot.offers.zeroPricePrevented)}
    </tr><tr>
      ${metric('Oferty wysłane', snapshot.offers.sent)}${metric('Oferty otwarte', snapshot.offers.viewed)}${metric('Oferty zaakceptowane', snapshot.offers.accepted)}${metric('Oferty odrzucone', snapshot.offers.rejected)}
    </tr><tr>
      ${metric('Umowy wysłane', snapshot.contracts.sent)}${metric('Umowy otwarte', snapshot.contracts.viewed)}${metric('Umowy podpisane', snapshot.contracts.signed)}${metric('Błędy umów', snapshot.contracts.failed)}
    </tr><tr>
      ${metric('Galerie wysłane', snapshot.galleries.sent)}${metric('Galerie otwarte', snapshot.galleries.opened)}${metric('Błędy galerii', snapshot.galleries.failed)}${metric('P0/P1 otwarte', snapshot.incidents.p0Open + snapshot.incidents.p1Open)}
    </tr><tr>
      ${metric('Konta rodziców', snapshot.galleries.groupAccountsCreated)}${metric('Magic login', snapshot.galleries.groupMagicLogins)}${metric('Wybory zatwierdzone', snapshot.galleries.groupSelectionsSubmitted)}${metric('Żądania ZIP', snapshot.galleries.archiveRequested)}
    </tr><tr>
      ${metric('ZIP utworzone', snapshot.galleries.archiveCreated)}${metric('ZIP reuse', snapshot.galleries.archiveReused)}${metric('ZIP gotowe / błędy', `${snapshot.galleries.archiveReady} / ${snapshot.galleries.archiveFailed}`)}${metric('Link ZIP / Adobe', `${snapshot.galleries.archiveLinksIssued} / ${snapshot.galleries.externalLinksIssued}`)}
    </tr><tr>
      ${metric('P0 otwarte', snapshot.incidents.p0Open)}${metric('P1 otwarte', snapshot.incidents.p1Open)}${metric('Potwierdzone', snapshot.incidents.acknowledged)}${metric('Rozwiązane', snapshot.incidents.resolved)}
    </tr></table>`;
}
