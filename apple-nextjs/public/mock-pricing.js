// Mock pricing data to inject into the page
(function () {
    const pricingData = {
        'iphone-17-pro': { from: 'From $1099', perMonth: '$45.79', months: '24' },
        'iphone-air': { from: 'From $999', perMonth: '$41.62', months: '24' },
        'iphone-17': { from: 'From $799', perMonth: '$33.29', months: '24' },
        'iphone-16': { from: 'From $699', perMonth: '$29.12', months: '24' },
        'iphone-16e': { from: 'From $599', perMonth: '$24.95', months: '24' }
    };

    function injectPricing() {
        // Fill in pricing templates
        document.querySelectorAll('[data-pricing-product]').forEach(el => {
            const product = el.getAttribute('data-pricing-product');
            const template = el.getAttribute('data-product-template');
            const data = pricingData[product];

            if (data && template) {
                let text = template
                    .replace('${price.display.from}', data.from)
                    .replace('${price.display.perMonth}', data.perMonth)
                    .replace('${price.display.months}', data.months);
                el.textContent = text;
            }
        });

        // Show pricing containers that were hidden
        document.querySelectorAll('[data-pricing-hide]').forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        });
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPricing);
    } else {
        injectPricing();
    }

    // Also run after a delay to catch dynamically loaded content
    setTimeout(injectPricing, 500);
    setTimeout(injectPricing, 1500);
})();
