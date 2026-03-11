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
            dropdown.style.setProperty('background-color', 'white', 'important');
            dropdown.style.setProperty('z-index', '2000000005', 'important');
            dropdown.style.setProperty('opacity', '1', 'important');
            dropdown.style.setProperty('visibility', 'visible', 'important');
            dropdownContent.style.opacity = '1';
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
});
