-- =====================================================
-- STYLE GUIDE SYSTEM: Jak się ubrać na sesję
-- Created: 2026-05-21
-- Purpose: Comprehensive styling guide with color palettes, outfit examples
-- =====================================================

-- Color Palettes for photo sessions
CREATE TABLE IF NOT EXISTS color_palettes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    season VARCHAR(50), -- 'spring', 'summer', 'autumn', 'winter', 'all'
    location_type VARCHAR(50), -- 'nature', 'city', 'studio', 'beach', 'forest', 'home'
    mood VARCHAR(50), -- 'romantic', 'elegant', 'casual', 'formal', 'playful'
    colors JSONB NOT NULL, -- Array of {name, hex, description}
    example_images JSONB, -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Outfit Examples / Sets
CREATE TABLE IF NOT EXISTS outfit_sets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'family', 'couple', 'individual', 'children', 'maternity', 'business'
    group_size INTEGER, -- Number of people (1, 2, 3-5, 6-10, 10+)
    age_group VARCHAR(50), -- 'adult', 'children', 'teens', 'mixed', 'seniors'
    season VARCHAR(50),
    location_type VARCHAR(50),
    palette_id INTEGER REFERENCES color_palettes(id) ON DELETE SET NULL,
    outfit_details JSONB NOT NULL, -- Array of {person, items, notes, image}
    dos_and_donts JSONB, -- {dos: [], donts: []}
    example_images JSONB, -- Array of image URLs showing the outfit
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Style Guide Tips & Articles
CREATE TABLE IF NOT EXISTS style_guide_tips (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    tip_type VARCHAR(50), -- 'general', 'color', 'accessories', 'patterns', 'fabrics'
    category VARCHAR(50),
    icon VARCHAR(100), -- Lucide icon name
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Style Guide FAQs
CREATE TABLE IF NOT EXISTS style_guide_faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_color_palettes_slug ON color_palettes(slug);
CREATE INDEX IF NOT EXISTS idx_color_palettes_location ON color_palettes(location_type);
CREATE INDEX IF NOT EXISTS idx_color_palettes_season ON color_palettes(season);
CREATE INDEX IF NOT EXISTS idx_color_palettes_active ON color_palettes(is_active);

CREATE INDEX IF NOT EXISTS idx_outfit_sets_slug ON outfit_sets(slug);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_category ON outfit_sets(category);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_location ON outfit_sets(location_type);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_active ON outfit_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_featured ON outfit_sets(is_featured);
CREATE INDEX IF NOT EXISTS idx_outfit_sets_palette ON outfit_sets(palette_id);

CREATE INDEX IF NOT EXISTS idx_style_tips_slug ON style_guide_tips(slug);
CREATE INDEX IF NOT EXISTS idx_style_tips_active ON style_guide_tips(is_active);
CREATE INDEX IF NOT EXISTS idx_style_tips_type ON style_guide_tips(tip_type);

CREATE INDEX IF NOT EXISTS idx_style_faqs_category ON style_guide_faqs(category);

-- =====================================================
-- SAMPLE DATA - Color Palettes
-- =====================================================

INSERT INTO color_palettes (name, slug, description, season, location_type, mood, colors, display_order) VALUES
('Miękka Natura', 'miekka-natura', 'Idealna paleta na sesje plenerowe w naturze. Subtelne, stonowane kolory harmonizujące z zielenią.', 'spring', 'nature', 'romantic', 
'[
  {"name": "Beż lniany", "hex": "#E8DCC4", "description": "Bazowy kolor - świetny dla koszul i sukienek"},
  {"name": "Zieleń oliwkowa", "hex": "#8B9556", "description": "Akcent kolorystyczny - swetry, spodnie"},
  {"name": "Brudny róż", "hex": "#C8A49C", "description": "Delikatny akcent - sukienki, bluzki"},
  {"name": "Ciemna czekolada", "hex": "#4A3933", "description": "Element kontrastowy - spodnie, dodatki"}
]'::jsonb, 1),

('Elegancka Miejska', 'elegancka-miejska', 'Dla sesji w mieście - nowoczesne połączenie neutralnych kolorów z mocniejszym akcentem.', 'autumn', 'city', 'elegant',
'[
  {"name": "Śmietankowa biel", "hex": "#F5F1E8", "description": "Bazowy jasny - koszule, bluzki"},
  {"name": "Granat głęboki", "hex": "#2C3E50", "description": "Główny element - marynarki, spodnie"},
  {"name": "Karmel", "hex": "#B8936A", "description": "Ciepły akcent - swetry, dodatki"},
  {"name": "Ciemna czerń", "hex": "#1A1A1A", "description": "Kontrast - buty, dodatki"}
]'::jsonb, 2),

('Letnia Lekkość', 'letnia-lekkosc', 'Świeże, jasne kolory idealne na letnie sesje plenerowe. Pełne energii i radości.', 'summer', 'nature', 'playful',
'[
  {"name": "Błękit nieba", "hex": "#A8DADC", "description": "Świeży akcent - koszule, sukienki"},
  {"name": "Piaskowy beż", "hex": "#F1E9DA", "description": "Bazowy neutralny - spodnie, spódnice"},
  {"name": "Koralowy delikatny", "hex": "#F4A5A5", "description": "Ciepły akcent - dodatki, sukienki dziecięce"},
  {"name": "Khaki jasny", "hex": "#9DAA8C", "description": "Element natury - spodnie, koszule"}
]'::jsonb, 3),

('Zimowa Elegancja', 'zimowa-elegancja', 'Stonowane, głębokie kolory na zimowe sesje. Ciepłe akcenty w chłodnej palecie.', 'winter', 'nature', 'elegant',
'[
  {"name": "Kremowa wełna", "hex": "#E8E3DA", "description": "Bazowy ciepły - swetry, sukienki"},
  {"name": "Butelkowa zieleń", "hex": "#3D5A45", "description": "Główny akcent - swetry, płaszcze"},
  {"name": "Bordowy głęboki", "hex": "#7B3F3F", "description": "Elegancki akcent - szaliki, dodatki"},
  {"name": "Ciemny grafit", "hex": "#3A4047", "description": "Element kontrastu - spodnie, kurtki"}
]'::jsonb, 4);

-- =====================================================
-- SAMPLE DATA - Outfit Sets
-- =====================================================

INSERT INTO outfit_sets (title, slug, description, category, group_size, age_group, season, location_type, palette_id, outfit_details, dos_and_donts, is_featured, display_order) VALUES
('Rodzinna Harmonia - Duża Grupa', 'rodzinna-harmonia-duza-grupa', 'Zestaw dla dużej rodziny (8 dorosłych + 5 dzieci). Koordynacja kolorów bez efektu "mundurek".', 'family', 13, 'mixed', 'spring', 'nature', 1,
'[
  {
    "person": "Rodzice / Dziadkowie (2 osoby)",
    "items": [
      "Mama: Długa sukienka w kolorze beżu lnianego + kardigan w oliwce",
      "Tata: Koszula biała + spodnie chino w kolorze oliwkowym + kamizelka beżowa"
    ],
    "notes": "Najważniejsze osoby - bazowe, stonowane kolory"
  },
  {
    "person": "Dorośli rodzina (6 osób)",
    "items": [
      "Panie (3): Mix sukienek i bluzek - beż, brudny róż, oliwka. Różne długości i kroje",
      "Panowie (3): Koszule (białe, beżowe, jasna oliwka) + spodnie chino lub jeans ciemny + opcjonalnie szelki"
    ],
    "notes": "Variacje kolorów z palety - każdy trochę inny, ale spójny"
  },
  {
    "person": "Dzieci (5 osób)",
    "items": [
      "Dziewczynki: Sukienki/spódniczki w jasnych odcieniach (beż, brudny róż) + rajstopy",
      "Chłopcy: Koszule w bieli/beżu + spodnie/spodenki chino + opcjonalnie muszki/szelki"
    ],
    "notes": "Dzieci w najjaśniejszych odcieniach - wyróżniają się jako najmłodsi"
  }
]'::jsonb,
'{"dos": [
  "Koordynuj kolory, ale NIE ubieraj wszystkich tak samo",
  "Mieszaj faktury - len, bawełna, wełna",
  "Warstwy (kardigany, kamizelki) dodają głębi",
  "Akcesoria (chustki, szelki, muszki) dla charakteru",
  "Dzieci mogą być trochę bardziej kolorowe"
], "donts": [
  "Unikaj dużych logotypów i napisów",
  "Nie mieszaj zbyt wielu wzorów (max 2 osoby w delikatne wzory)",
  "Unikaj neonów i bardzo intensywnych kolorów",
  "Nie ubieraj wszystkich identycznie",
  "Unikaj za dużej ilości czerni w naturze"
]}'::jsonb, true, 1),

('Sesja Pary - Miasto', 'sesja-pary-miasto', 'Elegancki zestaw dla pary na sesję miejską. Nowoczesna elegancja z charakterem.', 'couple', 2, 'adult', 'autumn', 'city', 2,
'[
  {
    "person": "Ona",
    "items": [
      "Wersja 1: Sukienka midi w kolorze granatowym + botki karmelowe + płaszcz w beżu",
      "Wersja 2: Biała koszula + karmelowe spodnie wide leg + granatowa marynarka",
      "Dodatki: Minimalistyczna biżuteria, mała torebka"
    ],
    "notes": "Elegancja z casualowym twistem"
  },
  {
    "person": "On",
    "items": [
      "Granatowa marynarka (lub ciemniejszy sweter) + biała/śmietankowa koszula",
      "Spodnie chino karmelowe lub granatowe",
      "Opcjonalnie: Kamizelka, suspensory dla charakteru",
      "Buty: Brązowe casualowe lub sneakersy premium"
    ],
    "notes": "Smart casual - elegancki ale nie sztywny"
  }
]'::jsonb,
'{"dos": [
  "Połącz elegancję z wygodą",
  "Warstwy ubrań (marynarka, płaszcz) - możesz je zdjąć dla różnorodności",
  "Dobrze dopasowane ubrania",
  "Minimalizm w dodatkach"
], "donts": [
  "Unikaj bardzo formalnych garniturów (za sztywne)",
  "Nie mieszaj za wiele stylów (elegancja + sport = nie)",
  "Unikaj bardzo casualowych ubrań (dresy, sportowe bluzy)"
]}'::jsonb, true, 2);

-- =====================================================
-- SAMPLE DATA - Tips
-- =====================================================

INSERT INTO style_guide_tips (title, slug, content, tip_type, category, icon, is_featured, display_order) VALUES
('Zasada Trzech Kolorów', 'zasada-trzech-kolorow', 
'Wybierz maksymalnie 3 główne kolory dla całej rodziny. Jeden bazowy (neutralny), jeden główny akcent i jeden dodatkowy akcent. Pozwala to na spójność bez monotonii.', 
'color', 'general', 'Palette', true, 1),

('Warstwy Dodają Głębi', 'warstwy-dodaja-glebi',
'Kardigany, kamizelki, marynarki, szaliki - warstwy nie tylko dają więcej opcji podczas sesji (możesz je zdejmować), ale też dodają wizualnego zainteresowania i głębi zdjęciom.',
'general', 'general', 'Layers', true, 2),

('Unikaj Wielkich Logotypów', 'unikaj-logotypow',
'Duże napisy i logo przyciągają uwagę i odwracają od twarzy. Wybieraj ubrania bez widocznych marek. Jeśli już, to minimalistyczne i małe.',
'general', 'general', 'XCircle', true, 3),

('Dopasowanie Jest Kluczowe', 'dopasowanie-kluczowe',
'Lepiej prostsze ubranie, które świetnie leży, niż modne ale źle dopasowane. Unikaj za luźnych lub za ciasnych ubrań. Dobrze skrojone ubrania zawsze wyglądają lepiej na zdjęciach.',
'general', 'general', 'Check', true, 4);

COMMENT ON TABLE color_palettes IS 'Palety kolorów dla poradnika jak się ubrać';
COMMENT ON TABLE outfit_sets IS 'Przykładowe zestawy ubrań dla różnych typów sesji';
COMMENT ON TABLE style_guide_tips IS 'Porady i wskazówki dotyczące stylizacji';
COMMENT ON TABLE style_guide_faqs IS 'FAQ dotyczące ubioru na sesję';
