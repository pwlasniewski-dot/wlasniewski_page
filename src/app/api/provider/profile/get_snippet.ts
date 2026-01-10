export async function GET(req: NextRequest) {
    return withAuth(req, async (decoded) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: { photographer_profile: true }
            });

            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

            return NextResponse.json({
                success: true,
                profile: {
                    name: user.name,
                    phone: user.phone,
                    bio: user.photographer_profile?.bio || '',
                    specialties: user.photographer_profile?.specialties || '',
                    experience_years: user.photographer_profile?.experience_years || 0,
                    portfolio_enabled: user.photographer_profile?.portfolio_enabled ?? true,
                    avatar_url: user.photographer_profile?.avatar_url || '',
                    logo_url: user.photographer_profile?.logo_url || ''
                }
            });

        } catch (error) {
            console.error('Profile fetch error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}
