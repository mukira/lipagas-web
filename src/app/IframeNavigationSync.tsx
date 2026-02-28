'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IframeNavigationSync() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ensure the message comes from the same origin to prevent cross-site scripting
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'NAVIGATE' && event.data?.url) {
        router.push(event.data.url);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return null;
}
