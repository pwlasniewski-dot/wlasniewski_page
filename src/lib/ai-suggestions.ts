
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

    // Logic-based suggestion: Check goals
    const activeGoals = await prisma.businessGoal.findMany({
        where: {
            end_date: { gte: new Date() }
        }
    });

    for (const goal of activeGoals) {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        if (progress < 40 && new Date().getTime() > (goal.start_date.getTime() + goal.end_date.getTime()) / 2) {
            suggestions.push({
                id: `goal-${goal.id}-urgency`,
                type: 'FINANCIAL',
                title: `Cel "${goal.title}" jest zagrożony`,
                description: `Osiągnięto tylko ${progress.toFixed(1)}% celu w połowie czasu. Rozważ kampanię promocyjną lub mini-sesje.`,
                action_label: 'Dodaj zadanie kampanii',
                priority: 'HIGH'
            });
        }
    }

    // Placeholder for future LLM integration
    // const llmSuggestions = await callLLMProvider(dataContext);

    return suggestions;
}
