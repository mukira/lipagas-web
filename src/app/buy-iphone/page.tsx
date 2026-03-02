'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.toString();
    const src = query ? `/pages/buy-iphone.html?${query}` : '/pages/buy-iphone.html';

    return (
        <iframe
            src={src}
            style={{
                width: '100%',
                height: '100vh',
                border: 'none',
                display: 'block'
            }}
            title="Apple iPhone 17 Pro Checkout"
        />
    );
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <PageContent />
        </Suspense>
    );
}
