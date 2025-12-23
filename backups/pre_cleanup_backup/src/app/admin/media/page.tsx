'use client';

import MediaPicker from '@/components/admin/MediaPicker';
import toast from 'react-hot-toast';

export default function MediaPage() {

    // Optional: Handler for when an item is "selected" (single click outside selection mode)
    // Could copy URL to clipboard
    const handleSelect = (url: string | string[]) => {
        if (typeof url === 'string') {
            navigator.clipboard.writeText(url);
            toast.success('Skopiowano link do schowka');
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] -m-8">
            <MediaPicker
                isOpen={true}
                onClose={() => { }}
                onSelect={handleSelect}
                inline={true}
                multiple={true}
            />
        </div>
    );
}
