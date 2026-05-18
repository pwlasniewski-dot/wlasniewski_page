/**
 * Force Password Reset Script
 * 
 * Usage: Run this script to force password reset for all clients after security incident
 * 
 * Example:
 * ts-node scripts/force-password-reset.ts
 * 
 * Or for specific users:
 * ts-node scripts/force-password-reset.ts --emails="user1@example.com,user2@example.com"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forcePasswordReset() {
    try {
        const args = process.argv.slice(2);
        const emailsArg = args.find(arg => arg.startsWith('--emails='));
        
        let result;
        
        if (emailsArg) {
            // Force reset for specific emails
            const emails = emailsArg.split('=')[1].split(',').map(e => e.trim());
            console.log(`🔒 Forcing password reset for ${emails.length} specific users...`);
            
            result = await prisma.user.updateMany({
                where: {
                    email: {
                        in: emails
                    }
                },
                data: {
                    password_reset_required: true
                }
            });
        } else {
            // Force reset for ALL clients (excluding admins and users who already reset today)
            const excludeArg = args.find(arg => arg.startsWith('--exclude-emails='));
            const excludeEmails = excludeArg 
                ? excludeArg.split('=')[1].split(',').map(e => e.trim())
                : [];
            
            console.log('🔒 Forcing password reset for ALL clients...');
            if (excludeEmails.length > 0) {
                console.log(`   Excluding ${excludeEmails.length} users: ${excludeEmails.join(', ')}`);
            }
            console.log('⚠️  WARNING: This will require ALL client users to reset their passwords!');
            console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...');
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            result = await prisma.user.updateMany({
                where: {
                    role: {
                        in: ['CLIENT', 'PHOTOGRAPHER']
                    },
                    email: {
                        notIn: excludeEmails
                    }
                },
                data: {
                    password_reset_required: true
                }
            });
        }
        
        console.log(`✅ Password reset required flag set for ${result.count} users`);
        console.log('📧 Consider sending email notification to affected users');
        
    } catch (error) {
        console.error('❌ Error forcing password reset:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

forcePasswordReset();
