import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    try {
        // Fetch settings from DB
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
            console.error('Missing SMTP configuration');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: Number(settings.smtp_port) || 587,
            secure: Number(settings.smtp_port) === 465, // true for 465, false for other ports
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_password,
            },
        });

        await transporter.sendMail({
            from: settings.smtp_from || settings.smtp_user,
            to,
            subject,
            html,
        });

        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}
