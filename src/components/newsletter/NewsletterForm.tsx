"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";

const schema = z.object({
    email: z.string().email("Podaj poprawny adres e-mail"),
    source: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewsletterForm({
    source = "footer",
    variant = "default"
}: {
    source?: string;
    variant?: "default" | "minimal";
}) {
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS">("IDLE");
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { source }
    });

    const onSubmit = async (data: FormData) => {
        setStatus("LOADING");
        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                // 409 Conflict logic
                if (res.status === 409) {
                    toast.info("Już jesteś na liście newslettera!");
                    setStatus("IDLE");
                    return;
                }
                throw new Error(err.message || "Błąd zapisu");
            }

            setStatus("SUCCESS");
            toast.success("Witamy w newsletterze!");
            reset();
        } catch (error: any) {
            setStatus("IDLE");
            toast.error(error.message || "Wystąpił błąd");
        }
    };

    if (status === "SUCCESS") {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-emerald-500/20 rounded-lg text-emerald-400">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="font-medium">Dziękuję za zapis!</p>
                <p className="text-xs text-emerald-400/70 text-center mt-1">Sprawdź swoją skrzynkę (i folder spam).</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
            <div className="relative">
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                    <input
                        {...register("email")}
                        type="email"
                        placeholder="Twój adres email"
                        disabled={status === "LOADING"}
                        className={`w-full bg-zinc-900/80 border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-600'} rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600 transition-all outline-none disabled:opacity-50`}
                    />
                </div>

                {errors.email && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>
                )}

                <button
                    type="submit"
                    disabled={status === "LOADING"}
                    className="mt-3 w-full bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {status === "LOADING" ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Zapisywanie...
                        </>
                    ) : (
                        "Dołącz do newslettera"
                    )}
                </button>

                <p className="text-[10px] text-zinc-500 mt-3 text-center">
                    Zero spamu. Wypisujesz się jednym kliknięciem.
                </p>
            </div>
        </form>
    );
}
