import {
    LayoutDashboard,
    Image,
    Camera,
    FileText,
    Megaphone,
    Tag,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    X,
    Calendar,
    List,
    Trophy,
    Sparkles,
    Menu,
    Users,
    ChevronDown,
    Zap,
    Briefcase,
    Shield,
    FileEdit,
    Search,
    Box,
    Cake,
    TrendingUp,
    GraduationCap,
    MapPin,
    Mail,
    BookOpen,
    AlertTriangle
} from 'lucide-react';

export const navigation = [
    { name: 'Pulpit', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Media', href: '/admin/media', icon: Image },
    { name: 'Portfolio', href: '/admin/portfolio', icon: Camera },
    { name: 'Strony', href: '/admin/pages', icon: FileText },
    { name: 'Jak się ubrać', href: '/admin/style-guide/outfits', icon: Sparkles },
    { name: 'Przygotowanie klienta', href: '/admin/pages/przygotowanie-klienta', icon: BookOpen },
    {
        name: 'Rezerwacje',
        href: '/admin/bookings',
        icon: Calendar,
        children: [
            { name: 'Złożone rezerwacje', href: '/admin/bookings' },
            { name: 'Kalendarz i dostępność', href: '/admin/bookings/calendar' },
            { name: 'Zamówienia', href: '/admin/bookings/orders' },
            { name: 'Pakiety rezerwacji', href: '/admin/rezerwacja' },
            { name: 'Promocje pakietów', href: '/admin/promocje' },
            { name: 'Lejek zapytań', href: '/admin/photo-funnel' },
        ]
    },
    { name: 'Galerie', href: '/admin/galleries', icon: Image },
    { name: 'Oferta galerii', href: '/admin/gallery-shop', icon: Box },
    { name: 'Albumy nPhoto', href: '/admin/nphoto-albums', icon: Box },
    { name: 'Multimedia', href: '/admin/multimedia', icon: Sparkles },
    { name: 'Kostka 3D', href: '/admin/photo-cube', icon: Box },
    { name: 'Menu', href: '/admin/menu', icon: Menu },
    { name: 'Foto Wyzwania', href: '/admin/challenges', icon: Trophy },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Kody rabatowe', href: '/admin/socio', icon: Megaphone },
    { name: 'Kody promocyjne', href: '/admin/promo-codes', icon: Sparkles },
    { name: 'Banery', href: '/admin/banners', icon: Tag },
    { name: 'Opinie', href: '/admin/testimonials', icon: MessageSquare },
    {
        name: 'Vouchery / prezenty',
        href: '/admin/gift-cards',
        icon: FileText,
        children: [
            { name: 'Studio voucherów', href: '/admin/gift-cards' },
            { name: 'Oferta w sklepie', href: '/admin/gift-cards/sklep' },
        ]
    },
    { name: 'Zlecenia Dronowe', href: '/admin/drone-orders', icon: Zap },
    { name: 'Zapytania', href: '/admin/inquiries', icon: MessageSquare },
    {
        name: 'Klienci (CRM)',
        href: '/admin/clients',
        icon: Users,
        children: [
            { name: 'Lista klientów', href: '/admin/clients' },
        ]
    },
    {
        name: 'Foto-Match',
        href: '/admin/foto-match',
        icon: Sparkles,
        children: [
            { name: 'Dashboard', href: '/admin/foto-match' },
            { name: 'Profile', href: '/admin/foto-match/profiles' },
            { name: 'Zdjęcia do akceptacji', href: '/admin/foto-match/photos' },
            { name: 'Lista oczekujących', href: '/admin/foto-match/waitlist' },
            { name: 'Matching i bonusy', href: '/admin/foto-match/match-settings' },
            { name: 'Ustawienia', href: '/admin/foto-match/settings' },
        ]
    },
    {
        name: 'Warsztaty',
        href: '/admin/warsztaty',
        icon: GraduationCap,
        children: [
            { name: 'Lista warsztatów', href: '/admin/warsztaty' },
            { name: 'Uczestnicy', href: '/admin/warsztaty/uczestnicy' },
        ]
    },
    { name: 'Administratorzy', href: '/admin/users', icon: Shield },
    { name: 'Fotografowie', href: '/admin/photographers', icon: Camera },

    { name: 'Analityka', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Marketing & UTM', href: '/admin/marketing', icon: TrendingUp },
    { name: 'Mailing', href: '/admin/mailing', icon: Mail },
    {
        name: 'SEO Ops',
        href: '/admin/seo',
        icon: Search,
        children: [
            { name: 'Audyt & Autopilot', href: '/admin/seo' },
            { name: 'Nagłówki H1/H2/H3', href: '/admin/seo/headings' },
        ]
    },
    { name: 'Local SEO / Maps', href: '/admin/local-seo', icon: MapPin },
    { name: 'Logi', href: '/admin/logs', icon: List },
    { name: 'Incydenty', href: '/admin/incidents', icon: AlertTriangle },
    { name: 'Stopka', href: '/admin/footer', icon: FileText },
    {
        name: 'Ustawienia',
        href: '/admin/settings',
        icon: Settings,
        children: [
            { name: 'Ogólne', href: '/admin/settings' },
            { name: 'aeroanaliza.pl', href: '/admin/settings/aeroanaliza' },
        ]
    },
];


/** Select one leaf by path segments, including more specific sibling editors. */
export function activeAdminNavigation(pathname: string) {
    const candidates = navigation.flatMap(item => item.children
        ? item.children.map(child => ({href: child.href, parent: item.name}))
        : [{href: item.href, parent: item.name}]);
    return candidates.filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0] ?? null;
}
