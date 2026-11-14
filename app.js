/**
 * Portal Interactivity and GIGW / DOR Guidelines Compliance
 * Reference: Department of Revenue, Govt of India (dor.gov.in)
 */

// ======================================================================
// 1. STATE & ACCESSIBILITY CONTROLS
// ======================================================================
let currentFontSize = 16;
let isTickerPaused = false;
let pendingExternalUrl = '';

// Theme Color Selector (dor.gov.in multi-theme feature)
function setTheme(themeClass) {
    const root = document.documentElement;
    root.classList.remove('theme-red', 'theme-green', 'theme-blue');
    if (themeClass) {
        root.classList.add(themeClass);
    }
    try {
        localStorage.setItem('preferredTheme', themeClass);
    } catch (e) {}
}

// High Contrast Theme Toggle (WCAG 2.0 Level AA)
function toggleContrast() {
    document.body.classList.toggle('high-contrast');
    try {
        const isHc = document.body.classList.contains('high-contrast');
        localStorage.setItem('preferredContrast', isHc ? '1' : '0');
    } catch (e) {}
}

// Text Resizing (A-, A, A+)
function changeFontSize(direction) {
    const html = document.documentElement;
    if (direction === -1 && currentFontSize > 13) {
        currentFontSize -= 2;
    } else if (direction === 1 && currentFontSize < 21) {
        currentFontSize += 2;
    } else if (direction === 0) {
        currentFontSize = 16;
    }
    html.style.setProperty('--font-base', `${currentFontSize}px`);
}

// Language Mode Selector (Bilingual, English Only, Tamil Only)
function changeLanguageMode(mode) {
    const body = document.body;
    body.classList.remove('lang-en-only', 'lang-ta-only');
    
    if (mode === 'en') {
        body.classList.add('lang-en-only');
        document.documentElement.setAttribute('lang', 'en');
    } else if (mode === 'ta') {
        body.classList.add('lang-ta-only');
        document.documentElement.setAttribute('lang', 'ta');
    } else {
        // Bilingual Default
        document.documentElement.setAttribute('lang', 'en');
    }
    
    try {
        localStorage.setItem('preferredLangMode', mode);
    } catch (e) {}
}

// ======================================================================
// 2. DOR LATEST UPDATES TICKER (What's New)
// ======================================================================
function toggleTicker() {
    const track = document.getElementById('tickerTrack');
    const btn = document.getElementById('tickerToggleBtn');
    if (!track || !btn) return;
    
    isTickerPaused = !isTickerPaused;
    if (isTickerPaused) {
        track.classList.add('paused');
        btn.textContent = '▶ Play';
        btn.setAttribute('aria-label', 'Play Ticker');
    } else {
        track.classList.remove('paused');
        btn.textContent = '⏸ Pause';
        btn.setAttribute('aria-label', 'Pause Ticker');
    }
}

// ======================================================================
// 3. REACHING NEW PAGES - GIGW / DOR EXTERNAL NAVIGATION MODAL
// ======================================================================
function handleExternalLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    
    // Ignore internal anchor links or javascript:
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
    }
    
    // Check if user previously checked "Don't show this security notice during this session"
    let skipWarning = false;
    try {
        skipWarning = sessionStorage.getItem('skipExternalWarning') === 'true';
    } catch (err) {}
    
    if (skipWarning) {
        return; // Allow direct navigation in new tab
    }
    
    // Prevent immediate navigation and show the official modal
    e.preventDefault();
    pendingExternalUrl = href;
    
    const modal = document.getElementById('externalModalOverlay');
    const targetUrlDisplay = document.getElementById('modalTargetUrl');
    
    if (modal && targetUrlDisplay) {
        targetUrlDisplay.textContent = href;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent scroll behind modal
    }
}

function closeExternalModal() {
    const modal = document.getElementById('externalModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    pendingExternalUrl = '';
}

function proceedToExternalUrl() {
    const dontAskAgainCheckbox = document.getElementById('modalDontAskAgain');
    if (dontAskAgainCheckbox && dontAskAgainCheckbox.checked) {
        try {
            sessionStorage.setItem('skipExternalWarning', 'true');
        } catch (e) {}
    }
    
    const urlToOpen = pendingExternalUrl;
    closeExternalModal();
    
    if (urlToOpen) {
        // Open securely with noopener and noreferrer
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    }
}

// ======================================================================
// 4. ORG CHART TAB SWITCHER
// ======================================================================
function switchOrgTab(tabId) {
    const safeTabId = tabId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Hide all tabs
    const contents = document.querySelectorAll('.org-tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    // Deactivate all buttons
    const buttons = document.querySelectorAll('.org-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show active tab
    const activeContent = document.getElementById(`org_${safeTabId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    // Activate target button
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(safeTabId)) {
            btn.classList.add('active');
        }
    });
}

// ======================================================================
// 5. SOCIETIES DIRECTORY FILTERING & DYNAMIC TOTALS
// ======================================================================
let currentCircleFilter = 'all';

function filterSocieties(circle) {
    const allowed = ['all', 'chengalpattu', 'maduranthagam'];
    if (!allowed.includes(circle)) return;
    
    currentCircleFilter = circle;
    
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(circle)) {
            btn.classList.add('active');
        }
    });
    
    applyFilters();
}

function searchTable() {
    applyFilters();
}

function applyFilters() {
    const rawSearch = document.getElementById('societySearch');
    const searchVal = rawSearch ? rawSearch.value.replace(/[<>'"&]/g, '').toLowerCase() : '';
    const rows = document.querySelectorAll('#societiesTable tbody tr');
    
    let chengalpattuSum = 0;
    let maduranthagamSum = 0;
    let totalSum = 0;
    
    rows.forEach(row => {
        const circleType = row.getAttribute('data-circle');
        const text = row.innerText.toLowerCase();
        
        let circleMatch = false;
        if (currentCircleFilter === 'all') {
            circleMatch = true;
        } else if (currentCircleFilter === 'chengalpattu') {
            circleMatch = (circleType === 'chengalpattu' || circleType === 'both');
        } else if (currentCircleFilter === 'maduranthagam') {
            circleMatch = (circleType === 'maduranthagam' || circleType === 'both');
        }
        
        const searchMatch = text.includes(searchVal);
        
        if (circleMatch && searchMatch) {
            row.style.display = '';
            
            const cells = row.getElementsByTagName('td');
            if (cells.length >= 5) {
                const cVal = parseInt(cells[2].innerText) || 0;
                const mVal = parseInt(cells[3].innerText) || 0;
                
                chengalpattuSum += cVal;
                maduranthagamSum += mVal;
                totalSum += (cVal + mVal);
            }
        } else {
            row.style.display = 'none';
        }
    });
    
    const cEl = document.getElementById('totalChengalpattu');
    const mEl = document.getElementById('totalMaduranthagam');
    const tEl = document.getElementById('totalAll');
    
    if (cEl) cEl.innerText = chengalpattuSum;
    if (mEl) mEl.innerText = maduranthagamSum;
    if (tEl) tEl.innerText = totalSum;
}

// ======================================================================
// 6. SCROLL SPY & SIDEBAR SYNC
// ======================================================================
function initScrollSpy() {
    const sections = document.querySelectorAll('main.content-body section[id]');
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 140;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        if (currentSectionId) {
            sidebarItems.forEach(item => {
                const link = item.querySelector('a');
                if (link && link.getAttribute('href') === `#${currentSectionId}`) {
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        }
    }, { passive: true });
}

// ======================================================================
// 7. INITIALIZATION ON DOM LOAD
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Restore preferred theme from storage
    try {
        const savedTheme = localStorage.getItem('preferredTheme');
        if (savedTheme) setTheme(savedTheme);
        
        const savedContrast = localStorage.getItem('preferredContrast');
        if (savedContrast === '1') document.body.classList.add('high-contrast');
        
        const savedLangMode = localStorage.getItem('preferredLangMode');
        if (savedLangMode) {
            const select = document.getElementById('langSelect');
            if (select) select.value = savedLangMode;
            changeLanguageMode(savedLangMode);
        }
    } catch (e) {}

    // Attach External Navigation Modal listeners to all external links
    document.querySelectorAll('.external-nav-link, a[target="_blank"]').forEach(link => {
        link.addEventListener('click', handleExternalLinkClick);
    });

    // Modal Proceed button listener
    const modalProceedBtn = document.getElementById('modalProceedBtn');
    if (modalProceedBtn) {
        modalProceedBtn.addEventListener('click', proceedToExternalUrl);
    }

    // Close modal on Escape key press or clicking outside card
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeExternalModal();
    });

    const modalOverlay = document.getElementById('externalModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeExternalModal();
        });
    }

    // Sidebar active item on click
    document.querySelectorAll('.sidebar-item a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            link.parentElement.classList.add('active');
        });
    });

    // Initialize societies calculation
    applyFilters();

    // Initialize ScrollSpy for active sidebar highlight
    initScrollSpy();
});
