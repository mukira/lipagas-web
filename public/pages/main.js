/* main.js - Apple Navbar Interactions */

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('global-nav');
    const dropdown = document.getElementById('nav-dropdown');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    const navItems = document.querySelectorAll('.nav-item:not(.nav-item-apple):not(.nav-item-search):not(.nav-item-bag):not(.nav-item-menu)');
    const menuBtn = document.querySelector('.nav-item-menu');
    const menuLines = document.querySelectorAll('.line');

    let mouseLeaveTimeout;

    // Desktop Dropdown Logic
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            clearTimeout(mouseLeaveTimeout);
            const sectionName = item.textContent.trim();
            showDropdown(sectionName);
        });
    });

    nav.addEventListener('mouseleave', () => {
        mouseLeaveTimeout = setTimeout(() => {
            hideDropdown();
        }, 300);
    });

    function showDropdown(sectionName) {
        // Hide all sections first
        const sections = dropdown.querySelectorAll('.dropdown-section');
        let hasContent = false;
        
        sections.forEach(section => {
            if (section.getAttribute('data-section') === sectionName) {
                section.style.display = 'flex';
                hasContent = true;
            } else {
                section.style.display = 'none';
            }
        });

        if (hasContent) {
            dropdown.style.height = '480px';
            dropdownContent.style.opacity = '1';
            dropdownContent.style.transitionDelay = '0.2s';
            nav.classList.add('nav-active');
        } else {
            hideDropdown();
        }
    }

    function hideDropdown() {
        dropdown.style.height = '0';
        dropdownContent.style.opacity = '0';
        dropdownContent.style.transitionDelay = '0s';
        nav.classList.remove('nav-active');
    }

    // Mobile Menu Toggle
    const closeBtn = document.getElementById('nav-mobile-close');
    let isMenuOpen = false;

    function toggleMenu(open) {
        isMenuOpen = open;
        if (isMenuOpen) {
            nav.classList.add('nav-open');
            document.body.classList.add('noscroll');
        } else {
            nav.classList.remove('nav-open');
            document.body.classList.remove('noscroll');
        }
    }

    menuBtn.addEventListener('click', (e) => {
        // Stop both the event from reaching document-level sync scripts 
        // and its default link behavior.
        e.preventDefault();
        e.stopPropagation();

        if (window.innerWidth > 834) return;
        toggleMenu(!isMenuOpen);
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toggleMenu(false);
        });
    }

    // Close menu on resize if switching to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 834 && isMenuOpen) {
            toggleMenu(false);
        }
    });

    // Handle scroll for navbar transparency/styles
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    });

    // Modal logic
    document.addEventListener('click', (e) => {
        // Open modal
        const openBtn = e.target.closest('[data-modal-open]');
        if (openBtn) {
            const modalId = openBtn.getAttribute('data-modal-open');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('modal-open');
                document.body.classList.add('noscroll');
            }
            return;
        }

        // Close modal
        const closeBtn = e.target.closest('[data-modal-close]');
        if (closeBtn) {
            const modal = e.target.closest('.ric-modal');
            if (modal) {
                modal.classList.remove('modal-open');
                // Check if any other modal is still open before removing noscroll
                if (!document.querySelector('.ric-modal.modal-open')) {
                    document.body.classList.remove('noscroll');
                }
            }
        }
    });

    // Close modal on background click
    document.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('ric-modal') || e.target.hasAttribute('data-modal-container')) {
             const modal = e.target.closest('.ric-modal');
             if (modal) {
                 modal.classList.remove('modal-open');
                 if (!document.querySelector('.ric-modal.modal-open')) {
                    document.body.classList.remove('noscroll');
                }
             }
        }
    });
});
