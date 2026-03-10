document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks on links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        // If another script already prevented the default action, respect it but capture navigation links.
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) {
            return;
        }

        // Resolve absolute URL
        const url = new URL(link.href, window.location.origin);
        
        // Only intercept if it's our own domain
        if (url.origin === window.location.origin) {
            // Anchor link on same page
            if (url.pathname === window.location.pathname && url.hash) {
                return;
            }

            e.preventDefault();

            // Map the path to Next.js route
            let nextRoute = url.pathname;
            if (nextRoute.startsWith('/pages/')) {
                nextRoute = nextRoute.replace('/pages/', '/');
            }
            if (nextRoute.endsWith('.html')) {
                nextRoute = nextRoute.replace('.html', '');
            }
            if (nextRoute === '/index' || nextRoute === '/') {
                nextRoute = '/';
            }

            // Keep search/hash
            const fullRoute = nextRoute + url.search + url.hash;

            // Notify parent
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'NAVIGATE', url: fullRoute }, '*');
            } else {
                window.location.href = fullRoute;
            }
        }
    });
});
