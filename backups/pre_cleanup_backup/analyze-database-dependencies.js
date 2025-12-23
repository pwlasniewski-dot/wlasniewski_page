const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDatabaseDependencies() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  COMPREHENSIVE DATABASE DEPENDENCIES ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');

    const issues = [];

    try {
        // 1. Check MenuItem -> Page relationship
        console.log('📋 1. MenuItem → Page Relationship');
        console.log('─────────────────────────────────────');
        const menuItems = await prisma.menuItem.findMany({
            include: {
                page: true
            }
        });

        console.log(`Total menu_items: ${menuItems.length}`);

        const orphanedMenuItems = menuItems.filter(mi => mi.page_id && !mi.page);
        if (orphanedMenuItems.length > 0) {
            console.log(`❌ Found ${orphanedMenuItems.length} orphaned menu items (page_id points to non-existent page)`);
            orphanedMenuItems.forEach(mi => {
                console.log(`   - MenuItem ID ${mi.id}: page_id=${mi.page_id} (missing)`);
                issues.push({
                    table: 'menu_items',
                    issue: 'Orphaned foreign key',
                    details: `MenuItem ${mi.id} references non-existent page ${mi.page_id}`
                });
            });
        } else {
            console.log('✅ All menu items have valid page references (or no page_id)');
        }

        // 2. Check Page -> MenuItem relationship (DEPRECATED but still in schema)
        console.log('\n📄 2. Page → MenuItem Relationship (DEPRECATED)');
        console.log('─────────────────────────────────────');
        const pages = await prisma.page.findMany({
            include: {
                menu_items: true
            }
        });

        console.log(`Total pages: ${pages.length}`);
        const pagesWithMenuItems = pages.filter(p => p.menu_items.length > 0);
        if (pagesWithMenuItems.length > 0) {
            console.log(`⚠️ ${pagesWithMenuItems.length} pages still have menu_items entries (deprecated)`);
            issues.push({
                table: 'menu_items',
                issue: 'Deprecated data present',
                details: `${pagesWithMenuItems.length} pages have menu_items - should migrate to is_in_menu field`
            });
        } else {
            console.log('✅ No pages use deprecated menu_items table');
        }

        // 3. Check MediaLibrary relationships
        console.log('\n🖼️  3. MediaLibrary Relationships');
        console.log('─────────────────────────────────────');

        // 3a. MediaLibrary -> AdminUser (uploader)
        const media = await prisma.mediaLibrary.findMany({
            include: {
                uploader: true
            }
        });
        console.log(`Total media files: ${media.length}`);

        const mediaWithoutUploader = media.filter(m => m.uploaded_by && !m.uploader);
        if (mediaWithoutUploader.length > 0) {
            console.log(`❌ ${mediaWithoutUploader.length} media files reference non-existent admin users`);
            issues.push({
                table: 'media_library',
                issue: 'Orphaned uploader reference',
                details: `${mediaWithoutUploader.length} media files have invalid uploaded_by`
            });
        } else {
            console.log('✅ All media uploader references valid');
        }

        // 3b. Check reverse relationships (pages/posts using media)
        console.log('\n   Checking media usage...');
        const portfolioSessions = await prisma.portfolioSession.findMany({
            include: { cover_image: true }
        });
        const orphanedPortfolioMedia = portfolioSessions.filter(p => p.cover_image_id && !p.cover_image);
        if (orphanedPortfolioMedia.length > 0) {
            console.log(`   ❌ ${orphanedPortfolioMedia.length} portfolio sessions reference missing cover images`);
            issues.push({
                table: 'portfolio_sessions',
                issue: 'Orphaned media reference',
                details: `Missing cover_image_id references`
            });
        } else {
            console.log('   ✅ Portfolio cover images valid');
        }

        const blogPosts = await prisma.blogPost.findMany({
            include: { featured_image: true, author: true }
        });
        const orphanedBlogMedia = blogPosts.filter(b => b.featured_image_id && !b.featured_image);
        const orphanedBlogAuthor = blogPosts.filter(b => b.author_id && !b.author);
        if (orphanedBlogMedia.length > 0) {
            console.log(`   ❌ ${orphanedBlogMedia.length} blog posts reference missing images`);
            issues.push({
                table: 'blog_posts',
                issue: 'Orphaned media reference',
                details: 'Missing featured_image_id references'
            });
        }
        if (orphanedBlogAuthor.length > 0) {
            console.log(`   ❌ ${orphanedBlogAuthor.length} blog posts reference missing authors`);
            issues.push({
                table: 'blog_posts',
                issue: 'Orphaned author reference',
                details: 'Missing author_id references'
            });
        }
        if (orphanedBlogMedia.length === 0 && orphanedBlogAuthor.length === 0) {
            console.log('   ✅ Blog post references valid');
        }

        // 4. Check PhotoChallenge relationships
        console.log('\n📸 4. PhotoChallenge Module Relationships');
        console.log('─────────────────────────────────────');

        const challenges = await prisma.photoChallenge.findMany({
            include: {
                package: true,
                location: true,
                invitee_user: true
            }
        });
        console.log(`Total photo challenges: ${challenges.length}`);

        const orphanedChallenges = challenges.filter(c =>
            !c.package ||
            (c.location_id && !c.location) ||
            (c.invitee_user_id && !c.invitee_user)
        );

        if (orphanedChallenges.length > 0) {
            console.log(`❌ ${orphanedChallenges.length} challenges have broken references`);
            orphanedChallenges.forEach(c => {
                if (!c.package) {
                    console.log(`   - Challenge ${c.id}: missing package ${c.package_id}`);
                }
                if (c.location_id && !c.location) {
                    console.log(`   - Challenge ${c.id}: missing location ${c.location_id}`);
                }
                if (c.invitee_user_id && !c.invitee_user) {
                    console.log(`   - Challenge ${c.id}: missing user ${c.invitee_user_id}`);
                }
            });
            issues.push({
                table: 'photo_challenges',
                issue: 'Orphaned relationships',
                details: `${orphanedChallenges.length} challenges with missing package/location/user`
            });
        } else {
            console.log('✅ All photo challenge relationships valid');
        }

        // 5. Check Client Gallery relationships
        console.log('\n🖼️  5. Client Gallery Relationships');
        console.log('─────────────────────────────────────');

        const galleries = await prisma.clientGallery.findMany({
            include: {
                photos: true
            }
        });
        console.log(`Total client galleries: ${galleries.length}`);

        const orders = await prisma.photoOrder.findMany({
            include: {
                gallery: true
            }
        });
        const orphanedOrders = orders.filter(o => !o.gallery);
        if (orphanedOrders.length > 0) {
            console.log(`❌ ${orphanedOrders.length} photo orders reference missing galleries`);
            issues.push({
                table: 'photo_orders',
                issue: 'Orphaned gallery reference',
                details: `Orders with invalid gallery_id`
            });
        } else {
            console.log('✅ Photo orders valid');
        }

        // 6. Summary
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('  SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        if (issues.length === 0) {
            console.log('✅✅✅ NO ORPHANED RELATIONSHIPS FOUND! ✅✅✅');
            console.log('All foreign key constraints are satisfied.\n');
        } else {
            console.log(`❌ FOUND ${issues.length} DEPENDENCY ISSUES:\n`);
            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. [${issue.table}] ${issue.issue}`);
                console.log(`   ${issue.details}\n`);
            });
        }

        // 7. Generate SQL cleanup queries
        if (issues.length > 0) {
            console.log('\n═══════════════════════════════════════════════════════');
            console.log('  SQL CLEANUP QUERIES');
            console.log('═══════════════════════════════════════════════════════\n');

            console.log('-- WARNING: Review these queries before execution!\n');

            // Example cleanup for orphaned menu items
            if (orphanedMenuItems.length > 0) {
                console.log('-- Clean up orphaned menu items:');
                console.log('DELETE FROM "menu_items"');
                console.log('WHERE "page_id" IS NOT NULL');
                console.log('  AND "page_id" NOT IN (SELECT "id" FROM "pages");\n');
            }

            // Cleanup for deprecated menu_items
            if (pagesWithMenuItems.length > 0) {
                console.log('-- Remove all deprecated menu_items (menu now uses pages.is_in_menu):');
                console.log('DELETE FROM "menu_items";\n');
            }
        }

    } catch (error) {
        console.error('❌ Error during analysis:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeDatabaseDependencies();
