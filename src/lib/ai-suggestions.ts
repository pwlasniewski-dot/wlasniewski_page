
import prisma from '@/lib/db/prisma';

export interface AISuggestion {
    id: string;
    type: 'MARKETING' | 'EFFICIENCY' | 'FINANCIAL';
    title: string;
    description: string;
    action_label?: string;
    action_url?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Bridge for future AI integration.
 * Currently provides hardcoded/logic-based suggestions to demonstrate the UI.
 */
export async function getAISuggestions(): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // 1. Goal Progress Analysis
    const activeGoals = await prisma.businessGoal.findMany({
        where: { end_date: { gte: new Date() } }
    });

    for (const goal of activeGoals) {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const totalDuration = goal.end_date.getTime() - goal.start_date.getTime();
        const elapsed = new Date().getTime() - goal.start_date.getTime();
        const timelineProgress = (elapsed / totalDuration) * 100;

        if (progress < timelineProgress - 15) {
            suggestions.push({
                id: `goal-${goal.id}-urgency`,
                type: 'FINANCIAL',
                title: `Cel przychodowy "${goal.title}" jest opóźniony`,
                description: `Masz ${progress.toFixed(0)}% realizacji przy ${timelineProgress.toFixed(0)}% upływu czasu. Brakuje ${(goal.target_amount - goal.current_amount).toFixed(0)} zł.`,
                action_label: 'Zaplanuj promocję',
                priority: 'HIGH'
            });
        }
    }

    // 2. Lead & Outreach Analysis (Dron / B2B)
    const droneOrders = await prisma.droneOrder.count({
        where: { created_at: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }
    });

    if (droneOrders < 3) {
        suggestions.push({
            id: 'drone-outreach',
            type: 'MARKETING',
            title: 'Niska aktywność zapytań B2B (Drony)',
            description: `W ciągu ostatnich 30 dni wpłynęło tylko ${droneOrders} zapytań. Aby utrzymać tempo wzrostu, wyślij ofertę do min. 10 firm z branży fotowoltaicznej w Kujawsko-Pomorskim.`,
            action_label: 'Pobierz listę firm',
            priority: 'MEDIUM'
        });
    }

    // 3. Challenge Conversion Analysis
    const totalChallenges = await prisma.photoChallenge.count();
    const acceptedChallenges = await prisma.photoChallenge.count({
        where: { status: 'accepted' }
    });

    if (totalChallenges > 0 && (acceptedChallenges / totalChallenges) < 0.5) {
        suggestions.push({
            id: 'challenge-optimization',
            type: 'EFFICIENCY',
            title: 'Optymalizacja konwersji wyzwań',
            description: `Tylko ${((acceptedChallenges / totalChallenges) * 100).toFixed(0)}% wysłanych wyzwań zostaje zaakceptowanych. Rozważ zmianę treści zaproszenia lub zwiększenie rabatu o 5%.`,
            action_label: 'Edytuj szablony',
            priority: 'MEDIUM'
        });
    }

    // 4. Pending Tasks in Scrum
    const pendingTasks = await prisma.scrumTask.count({
        where: { status: 'TODO', priority: 'HIGH' }
    });

    if (pendingTasks > 0) {
        suggestions.push({
            id: 'scrum-bottleneck',
            type: 'EFFICIENCY',
            title: 'Zatory w zadaniach operacyjnych',
            description: `Masz ${pendingTasks} krytycznych zadań w kolejce. Skup się dziś na ich domknięciu, aby odblokować procesy sprzedażowe.`,
            priority: 'HIGH'
        });
    }

    // 5. Revenue Density Analysis (PLN per Hour)
    const services = await prisma.serviceType.findMany({
        include: { packages: true }
    });

    const densities = services.flatMap(s => s.packages.map(p => ({
        name: `${s.name} - ${p.name}`,
        density: p.hours > 0 ? (p.price / 100) / p.hours : 0
    }))).sort((a, b) => b.density - a.density);

    if (densities.length > 0) {
        const top = densities[0];
        suggestions.push({
            id: 'revenue-density-insight',
            type: 'FINANCIAL',
            title: `Najwyższa rentowność: ${top.name}`,
            description: `Usługa ta generuje średnio ${top.density.toFixed(0)} zł za godzinę pracy. Skupienie marketingu na tym segmencie najszybciej przybliży Cię do celów biznesowych.`,
            priority: 'LOW'
        });
    }

    return suggestions;
}
