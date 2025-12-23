'use client';

import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

interface PuzzleGalleryProps {
    photos: { url: string; alt?: string }[];
    config?: any;
}

export default function PuzzleGallery({ photos, config }: PuzzleGalleryProps) {
    if (!photos || photos.length < 2) return null;

    const leftPhoto = photos[0];
    const rightPhoto = photos[1];

    // Total Size: 600x400
    // Base Cell: 300x200
    // Tab Depth: 40px
    // Tab Width: ~80px (Neck ~50px)

    // Helper for Tab Out (Horizontal)
    // Starts at (x, y). Ends at (x, y+200).
    // Midpoint is y+100.
    // Curve: Out 40px.
    const tabOutRight = "L 300 60 C 300 60 340 60 340 100 C 340 140 300 140 300 140 L 300 200";

    // Helper for Slot In (Horizontal) - Matches Tab Out Right
    // Starts at (0, 200). Ends at (0, 0).
    // Reverse of Tab Out Right.
    // 300,140 -> 340,100 -> 300,60
    // So: 0,140 -> 40,100 -> 0,60 (relative to left edge)
    // But we draw clockwise. 
    // Left edge is drawn Bottom to Top usually (0,200 -> 0,0).
    // So: L 0 140 C 0 140 40 140 40 100 C 40 60 0 60 0 60 L 0 0
    const slotInLeft = "L 0 140 C 0 140 40 140 40 100 C 40 60 0 60 0 60 L 0 0";

    // Helper for Tab Out (Vertical)
    // Starts at (300, 200). Ends at (0, 200).
    // Midpoint x=150.
    // Curve: Out 40px (Down).
    // L 190 200 C 190 200 190 240 150 240 C 110 240 110 200 110 200 L 0 200
    const tabOutBottom = "L 190 200 C 190 200 190 240 150 240 C 110 240 110 200 110 200 L 0 200";

    // Helper for Slot In (Vertical) - Matches Tab Out Bottom
    // Starts at (0, 0). Ends at (300, 0).
    // Reverse of Tab Out Bottom.
    // 110,200 -> 150,240 -> 190,200
    // So: 110,0 -> 150,40 -> 190,0 (relative to top edge)
    // L 110 0 C 110 0 110 40 150 40 C 190 40 190 0 190 0 L 300 0
    const slotInTop = "L 110 0 C 110 0 110 40 150 40 C 190 40 190 0 190 0 L 300 0";


    // --- PATH DEFINITIONS ---

    // TL Piece (Top-Left)
    // Base: 300x200.
    // Right: Tab Out. Bottom: Tab Out.
    // Size with tabs: 340x240.
    const pathTL = `path('M 0 0 L 300 0 ${tabOutRight} ${tabOutBottom} L 0 200 Z')`;

    // TR Piece (Top-Right)
    // Base: 300x200.
    // Left: Slot In. Bottom: Tab Out.
    // Size: 300x240 (Left is 0, but slot goes in to 40. Width is 300).
    // Actually, if Left has Slot In, the visual width is 300. The "hole" is inside.
    // But we need to shift it right by 300.
    const pathTR = `path('M 0 0 L 300 0 L 300 200 ${tabOutBottom} ${slotInLeft} Z')`;

    // BL Piece (Bottom-Left)
    // Base: 300x200.
    // Top: Slot In. Right: Tab Out.
    // Size: 340x200.
    const pathBL = `path('M 0 0 ${slotInTop} ${tabOutRight} L 300 200 L 0 200 Z')`;

    // BR Piece (Bottom-Right)
    // Base: 300x200.
    // Top: Slot In. Left: Slot In.
    // Size: 300x200.
    const pathBR = `path('M 0 0 ${slotInTop} L 300 0 L 300 200 L 0 200 ${slotInLeft} Z')`;


    // --- ANIMATION VARIANTS ---
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const pieceVariants = (xOffset: number, yOffset: number): Variants => ({
        hidden: {
            x: xOffset,
            y: yOffset,
            opacity: 0,
            scale: 1.1,
            rotate: (Math.random() - 0.5) * 10
        },
        visible: {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                type: "spring",
                damping: 20,
                stiffness: 90,
                duration: 1.0
            }
        }
    });

    return (
        <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden bg-zinc-900/50">
            <motion.div
                className="relative w-[600px] h-[400px]"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.5 }}
            >
                {/* 
                   PIECE POSITIONING 
                   Container is 600x400.
                   TL: 0,0.
                   TR: 300,0.
                   BL: 0,200.
                   BR: 300,200.
                   
                   Z-Indexes:
                   Tabs overlap Slots.
                   TL has Right Tab -> Overlaps TR.
                   TL has Bottom Tab -> Overlaps BL.
                   TR has Bottom Tab -> Overlaps BR.
                   BL has Right Tab -> Overlaps BR.
                   
                   So:
                   TL > TR (at border)
                   TL > BL (at border)
                   TR > BR (at border)
                   BL > BR (at border)
                   
                   Order: TL (Highest), TR/BL (Middle), BR (Lowest).
                   Actually:
                   TL overlaps TR and BL.
                   TR overlaps BR.
                   BL overlaps BR.
                   So TL=3, TR=2, BL=2, BR=1 ?
                   Wait, BL has Right Tab -> Overlaps BR.
                   TR has Bottom Tab -> Overlaps BR.
                   So BR is definitely bottom.
                   TL has Right Tab -> Overlaps TR.
                   So TL > TR.
                   TL has Bottom Tab -> Overlaps BL.
                   So TL > BL.
                   
                   Z-Index:
                   TL: 4
                   TR: 3 (or 2)
                   BL: 3 (or 2)
                   BR: 1
                */}

                {/* TL Piece (Z: 40) */}
                <motion.div
                    className="absolute top-0 left-0 w-[340px] h-[240px] z-40 drop-shadow-2xl"
                    style={{ clipPath: pathTL }}
                    variants={pieceVariants(-50, -50)}
                >
                    {/* Image: Left Photo. Full Size 300x400. Pos: 0,0 */}
                    <div className="relative w-[340px] h-[400px]">
                        <Image
                            src={leftPhoto.url}
                            alt="Puzzle TL"
                            fill
                            className="object-cover"
                            sizes="300px"
                            priority
                        />
                        {/* Inner Shadow for depth */}
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                    </div>
                </motion.div>

                {/* TR Piece (Z: 30) */}
                <motion.div
                    className="absolute top-0 left-[300px] w-[300px] h-[240px] z-30 drop-shadow-xl"
                    style={{ clipPath: pathTR }}
                    variants={pieceVariants(50, -50)}
                >
                    {/* Image: Right Photo. Full Size 300x400. Pos: 0,0 */}
                    <div className="relative w-[300px] h-[400px]">
                        <Image
                            src={rightPhoto.url}
                            alt="Puzzle TR"
                            fill
                            className="object-cover"
                            sizes="300px"
                            priority
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                    </div>
                </motion.div>

                {/* BL Piece (Z: 30) */}
                <motion.div
                    className="absolute top-[200px] left-0 w-[340px] h-[200px] z-30 drop-shadow-xl"
                    style={{ clipPath: pathBL }}
                    variants={pieceVariants(-50, 50)}
                >
                    {/* Image: Left Photo. Full Size 300x400. Pos: 0, -200 */}
                    <div className="relative w-[340px] h-[400px] -mt-[200px]">
                        <Image
                            src={leftPhoto.url}
                            alt="Puzzle BL"
                            fill
                            className="object-cover"
                            sizes="300px"
                            priority
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                    </div>
                </motion.div>

                {/* BR Piece (Z: 20) */}
                <motion.div
                    className="absolute top-[200px] left-[300px] w-[300px] h-[200px] z-20 drop-shadow-lg"
                    style={{ clipPath: pathBR }}
                    variants={pieceVariants(50, 50)}
                >
                    {/* Image: Right Photo. Full Size 300x400. Pos: 0, -200 */}
                    <div className="relative w-[300px] h-[400px] -mt-[200px]">
                        <Image
                            src={rightPhoto.url}
                            alt="Puzzle BR"
                            fill
                            className="object-cover"
                            sizes="300px"
                            priority
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
