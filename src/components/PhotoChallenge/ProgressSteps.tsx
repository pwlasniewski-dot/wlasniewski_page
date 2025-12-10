'use client';

// Progress Steps Component

import { Check } from 'lucide-react';

type StepStatus = 'completed' | 'current' | 'upcoming';

interface Step {
    label: string;
    status: StepStatus;
}

interface ProgressStepsProps {
    currentStep: 'sent' | 'viewed' | 'accepted' | 'scheduled' | 'completed' | 'gallery';
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
    const steps: Step[] = [
        {
            label: 'Wysłane',
            status: getStepStatus('sent', currentStep)
        },
        {
            label: 'Wyświetlone',
            status: getStepStatus('viewed', currentStep)
        },
        {
            label: 'Zaakceptowane',
            status: getStepStatus('accepted', currentStep)
        },
        {
            label: 'Termin',
            status: getStepStatus('scheduled', currentStep)
        },
        {
            label: 'Sesja',
            status: getStepStatus('completed', currentStep)
        },
        {
            label: 'Galeria',
            status: getStepStatus('gallery', currentStep)
        },
    ];

    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center flex-1">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${step.status === 'completed'
                                        ? 'bg-gold-400 border-gold-400'
                                        : step.status === 'current'
                                            ? 'bg-gold-900/30 border-gold-400 ring-2 ring-gold-400/50'
                                            : 'bg-gray-800 border-gray-600'
                                    }
                `}
                            >
                                {step.status === 'completed' ? (
                                    <Check className="w-5 h-5 md:w-6 md:h-6 text-black" />
                                ) : (
                                    <span
                                        className={`
                      text-sm md:text-base font-bold
                      ${step.status === 'current' ? 'text-gold-400' : 'text-gray-500'}
                    `}
                                    >
                                        {index + 1}
                                    </span>
                                )}
                            </div>

                            {/* Step Label */}
                            <span
                                className={`
                  mt-2 text-xs md:text-sm text-center whitespace-nowrap
                  ${step.status === 'completed' || step.status === 'current'
                                        ? 'text-gold-400 font-semibold'
                                        : 'text-gray-500'
                                    }
                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`
                  flex-1 h-0.5 mx-2 transition-all duration-300
                  ${step.status === 'completed' ? 'bg-gold-400' : 'bg-gray-700'}
                `}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getStepStatus(
    stepName: string,
    currentStep: string
): StepStatus {
    const stepOrder = ['sent', 'viewed', 'accepted', 'scheduled', 'completed', 'gallery'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const thisIndex = stepOrder.indexOf(stepName);

    if (thisIndex < currentIndex) return 'completed';
    if (thisIndex === currentIndex) return 'current';
    return 'upcoming';
}
