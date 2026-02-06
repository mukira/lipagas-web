(function() {
    function initScrollers() {
        const scrollers = document.querySelectorAll('.rf-cards-scroller');
        scrollers.forEach(scroller => {
            const content = scroller.querySelector('.rf-cards-scroller-content');
            const platter = scroller.querySelector('.rf-cards-scroller-platter');
            const btnNext = scroller.querySelector('.paddlenav-arrow-next');
            const btnPrev = scroller.querySelector('.paddlenav-arrow-previous');

            if (!content || !btnNext || !btnPrev) return;

            // Remove existing disabled attributes if they were hardcoded
            btnNext.disabled = false;
            btnPrev.disabled = true; // Initially at start

            function updateButtons() {
                const scrollLeft = content.scrollLeft;
                const maxScroll = content.scrollWidth - content.clientWidth;
                
                btnPrev.disabled = scrollLeft <= 0;
                btnNext.disabled = scrollLeft >= maxScroll - 5; // offset for subpixel issues
            }

            function getScrollStep() {
                const firstItem = platter.querySelector('[data-core-scroller-item]');
                if (firstItem) {
                    return firstItem.offsetWidth + 20; // 20 is approx margin
                }
                return content.clientWidth * 0.8; // Fallback
            }

            btnNext.addEventListener('click', (e) => {
                e.preventDefault();
                const step = getScrollStep();
                content.scrollBy({ left: step, behavior: 'smooth' });
                setTimeout(updateButtons, 500); // Wait for scroll to finish
            });

            btnPrev.addEventListener('click', (e) => {
                e.preventDefault();
                const step = getScrollStep();
                content.scrollBy({ left: -step, behavior: 'smooth' });
                setTimeout(updateButtons, 500); // Wait for scroll to finish
            });

            content.addEventListener('scroll', updateButtons);
            window.addEventListener('resize', updateButtons);
            updateButtons();
        });
    }

    // Initialize after a short delay to ensure everything is rendered
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initScrollers, 1000));
    } else {
        setTimeout(initScrollers, 1000);
    }
})();
