import nodemailer from 'nodemailer';
import prisma from '@/lib/db/prisma';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    try {
        // Fetch settings from DB
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: {
                    in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from']
                }
            }
        });

        const config = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {} as Record<string, string | null>);

        if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
            console.error('Missing SMTP configuration');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: Number(config.smtp_port) || 587,
            secure: Number(config.smtp_port) === 465, // true for 465, false for other ports
            auth: {
                user: config.smtp_user,
                pass: config.smtp_password,
            },
        });

        await transporter.sendMail({
            from: config.smtp_from || config.smtp_user,
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
