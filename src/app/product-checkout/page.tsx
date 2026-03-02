'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.toString();
    const src = query ? `/pages/product-checkout.html?${query}` : '/pages/product-checkout.html';

    return (
        <iframe
            src={src}
            style={{
                width: '100%',
                height: '100vh',
                border: 'none',
                display: 'block'
            }}
            title="Product Checkout"
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
