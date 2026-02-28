document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks on links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href) {
            // Only intercept relative links or links to the same origin
            const url = new URL(link.href);
            if (url.origin === window.location.origin) {
                // If it's an anchor link on the same page, just scroll to it
                if (url.pathname === window.location.pathname && url.hash) {
                    return; // Let the browser handle the hash scroll natively inside the iframe
                }

                e.preventDefault();

                // Map the inner HTML path to the outer Next.js route
                let nextRoute = url.pathname;
                if (nextRoute.startsWith('/pages/')) {
                    nextRoute = nextRoute.replace('/pages/', '/').replace('.html', '');
                } else if (nextRoute.endsWith('.html')) {
                    nextRoute = nextRoute.replace('.html', '');
                }

                // Keep the hash/query if any
                nextRoute += url.search + url.hash;

                // Send a message to the Next.js parent telling it to navigate
                window.parent.postMessage({ type: 'NAVIGATE', url: nextRoute }, '*');
            }
        }
    });
});
