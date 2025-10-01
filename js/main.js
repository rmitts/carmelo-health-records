document.addEventListener("DOMContentLoaded", function() {
    // --- 1. COMPONENT LOADING ---
    const loadComponent = (component, targetId, callback) => {
        fetch(component)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load component: ${component}`);
                }
                return response.text();
            })
            .then(data => {
                const target = document.getElementById(targetId);
                if (target) {
                    target.innerHTML = data;
                }
                if (callback) {
                    callback();
                }
            })
            .catch(error => console.error(`Error loading component:`, error));
    };

    // --- 2. INITIALIZATION LOGIC (RUNS AFTER NAV IS LOADED) ---
    const initializeSite = () => {
        // a. Set Active Navigation Link
        const getFileName = (url) => {
            let filename = url.substring(url.lastIndexOf('/') + 1);
            if (filename === '' || filename === 'carmelo-health-records') {
                return 'index.html';
            }
            return filename.split('#')[0]; // Remove hash for accurate matching
        };

        const currentPageFile = getFileName(window.location.href);
        const navLinks = document.querySelectorAll('#main-nav a[href]');

        navLinks.forEach(link => {
            if (link.href.endsWith('.html') || link.href.endsWith('/')) {
                const linkFile = getFileName(link.href);
                const isMobile = link.classList.contains('block');

                const activeClasses = isMobile ? ['bg-health-blue', 'text-white'] : ['bg-health-blue', 'text-white'];
                const inactiveClasses = isMobile ? ['text-gray-700', 'hover:text-health-blue', 'hover:bg-gray-100'] : ['text-gray-700', 'hover:text-health-blue', 'hover:bg-gray-100'];

                link.classList.remove(...activeClasses, ...inactiveClasses);

                if (linkFile === currentPageFile) {
                    link.classList.add(...activeClasses);
                } else {
                    link.classList.add(...inactiveClasses);
                }
            }
        });

        // b. Mobile Menu Toggle
        const mobileMenuButton = document.querySelector('.mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // c. Accordion logic (for chatgpt-report.html)
        const accordions = document.querySelectorAll('.accordion');
        if (accordions.length > 0) {
            accordions.forEach(btn => {
                const panel = btn.nextElementSibling;
                const chev = btn.querySelector('.chev');
                if (panel && chev) {
                    panel.style.display = 'block';
                    btn.addEventListener('click', () => {
                        const isOpen = panel.style.display !== 'none';
                        panel.style.display = isOpen ? 'none' : 'block';
                        chev.classList.toggle('rotate-180', !isOpen);
                    });
                }
            });
        }

        // d. Side-navigation and scroll-to-top (for clinical-nutrition-report.html)
        const sideNav = document.getElementById('side-nav');
        if (sideNav) {
            const content = document.getElementById('report-content');
            const headings = content.querySelectorAll('h2, h3');
            const allNavLinks = [];

            const createNavLink = (heading) => {
                if (!heading.id) return;
                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.textContent = heading.textContent;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    heading.scrollIntoView({ behavior: 'smooth' });
                });
                return link;
            };

            headings.forEach(heading => {
                if (heading.id) {
                    const link = createNavLink(heading);
                    link.className = `nav-link block text-sm py-1 border-l-2 border-transparent ${heading.tagName === 'H3' ? 'pl-6' : 'pl-3 font-medium'}`;
                    document.getElementById('nav-links').appendChild(link);
                    allNavLinks.push(link);
                }
            });

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        allNavLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, { rootMargin: '-100px 0px -50% 0px' });
            headings.forEach(h => observer.observe(h));

            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (scrollToTopBtn) {
                window.onscroll = () => {
                    scrollToTopBtn.classList.toggle('hidden', document.body.scrollTop < 100 && document.documentElement.scrollTop < 100);
                };
                scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            }
        }
    };

    // --- INITIALIZE THE SITE ---
    loadComponent('components/nav.html', 'main-nav', initializeSite);
    loadComponent('components/footer.html', 'main-footer');
});