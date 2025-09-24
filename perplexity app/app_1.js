// Application state management
let appState = {
  currentSection: 'executive-summary',
  collapsedSections: new Set(),
  searchTerm: '',
  isSearching: false
};

// DOM elements cache
let elements = {};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// Main initialization function
function initializeApp() {
  console.log('Initializing Gemini Report application...');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup all functionality
  setupSearch();
  setupNavigation();
  setupSectionToggles();
  setupProgressTracking();
  setupPrintFunctionality();
  setupKeyboardShortcuts();
  setupMobileFeatures();
  
  // Initialize state
  updateReadingProgress();
  updateActiveNavLink('executive-summary');
  
  console.log('Application initialized successfully');
}

// Cache frequently used DOM elements
function cacheElements() {
  elements = {
    searchInput: document.getElementById('report-search'),
    searchClear: document.getElementById('search-clear'),
    progressFill: document.getElementById('reading-progress'),
    progressText: document.getElementById('progress-text'),
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('.report-section'),
    sectionHeaders: document.querySelectorAll('.section-header'),
    sectionToggles: document.querySelectorAll('.section-toggle'),
    sectionContents: document.querySelectorAll('.section-content'),
    reportContent: document.querySelector('.report-content'),
    sidebar: document.querySelector('.report-sidebar')
  };
}

// Search functionality
function setupSearch() {
  if (!elements.searchInput || !elements.searchClear) return;
  
  // Search input handler
  elements.searchInput.addEventListener('input', handleSearchInput);
  elements.searchInput.addEventListener('keydown', handleSearchKeydown);
  
  // Clear search handler
  elements.searchClear.addEventListener('click', clearSearch);
  
  console.log('Search functionality initialized');
}

function handleSearchInput(e) {
  const searchTerm = e.target.value.trim().toLowerCase();
  appState.searchTerm = searchTerm;
  
  // Show/hide clear button
  elements.searchClear.style.display = searchTerm ? 'block' : 'none';
  
  if (searchTerm.length >= 2) {
    performSearch(searchTerm);
  } else {
    clearSearchHighlights();
  }
}

function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const searchTerm = e.target.value.trim().toLowerCase();
    if (searchTerm.length >= 2) {
      jumpToNextSearchResult();
    }
  } else if (e.key === 'Escape') {
    clearSearch();
  }
}

function performSearch(searchTerm) {
  clearSearchHighlights();
  
  let resultsFound = 0;
  let firstResult = null;
  
  elements.sections.forEach(section => {
    const content = section.querySelector('.section-content');
    if (!content) return;
    
    // Get all text content and check for matches
    const allTextContent = content.innerText || content.textContent || '';
    const regex = new RegExp(escapeRegex(searchTerm), 'gi');
    const matches = allTextContent.match(regex);
    
    if (matches && matches.length > 0) {
      resultsFound += matches.length;
      
      // Expand section if collapsed
      if (appState.collapsedSections.has(section.id)) {
        expandSection(section.id);
      }
      
      // Highlight matches in the content
      highlightInElement(content, searchTerm);
      
      if (!firstResult) {
        firstResult = section;
      }
    }
  });
  
  // Update search state
  appState.isSearching = resultsFound > 0;
  
  // Show notification
  if (resultsFound > 0) {
    showNotification(`Found ${resultsFound} result${resultsFound > 1 ? 's' : ''} for "${searchTerm}"`, 'success');
    
    // Scroll to first result
    if (firstResult) {
      scrollToSection(firstResult.id);
    }
  } else {
    showNotification(`No results found for "${searchTerm}"`, 'warning');
  }
}

function highlightInElement(element, searchTerm) {
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  
  // Function to recursively process text nodes
  function processTextNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        
        const parent = node.parentNode;
        while (wrapper.firstChild) {
          parent.insertBefore(wrapper.firstChild, node);
        }
        parent.removeChild(node);
        return true;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('search-highlight')) {
      // Process child nodes
      const children = Array.from(node.childNodes);
      children.forEach(child => processTextNode(child));
    }
    return false;
  }
  
  // Process all child nodes
  const children = Array.from(element.childNodes);
  children.forEach(child => processTextNode(child));
}

function clearSearch() {
  elements.searchInput.value = '';
  elements.searchClear.style.display = 'none';
  clearSearchHighlights();
  appState.searchTerm = '';
  appState.isSearching = false;
}

function clearSearchHighlights() {
  const highlights = document.querySelectorAll('.search-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    }
  });
}

function jumpToNextSearchResult() {
  const highlights = document.querySelectorAll('.search-highlight');
  if (highlights.length === 0) return;
  
  // Find the next highlight after current scroll position
  const scrollTop = window.pageYOffset;
  let nextHighlight = null;
  
  for (let highlight of highlights) {
    const rect = highlight.getBoundingClientRect();
    const absoluteTop = rect.top + scrollTop;
    
    if (absoluteTop > scrollTop + 100) {
      nextHighlight = highlight;
      break;
    }
  }
  
  // If no next highlight found, go to first one
  if (!nextHighlight) {
    nextHighlight = highlights[0];
  }
  
  // Scroll to highlight
  nextHighlight.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Temporarily highlight the target
  nextHighlight.style.backgroundColor = 'rgba(255, 193, 7, 0.6)';
  setTimeout(() => {
    nextHighlight.style.backgroundColor = '';
  }, 2000);
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Navigation functionality
function setupNavigation() {
  // Navigation link handlers
  elements.navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });
  
  // Setup intersection observer for automatic navigation updates
  setupIntersectionObserver();
  
  console.log('Navigation functionality initialized');
}

function handleNavClick(e) {
  e.preventDefault();
  const targetId = this.getAttribute('href').substring(1);
  scrollToSection(targetId);
  updateActiveNavLink(targetId);
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  // Expand section if collapsed
  if (appState.collapsedSections.has(sectionId)) {
    expandSection(sectionId);
  }
  
  // Smooth scroll to section
  const headerHeight = 80; // Approximate header height
  const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerHeight;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
  
  appState.currentSection = sectionId;
}

function updateActiveNavLink(sectionId) {
  elements.navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + sectionId) {
      link.classList.add('active');
    }
  });
  
  appState.currentSection = sectionId;
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        updateActiveNavLink(entry.target.id);
      }
    });
  }, {
    threshold: [0.1, 0.3, 0.7],
    rootMargin: '-80px 0px -50% 0px'
  });
  
  elements.sections.forEach(section => {
    observer.observe(section);
  });
}

// Section toggle functionality
function setupSectionToggles() {
  // Header click handlers (excluding toggle button)
  elements.sectionHeaders.forEach(header => {
    header.addEventListener('click', function(e) {
      // Don't trigger if clicking the toggle button
      if (e.target.classList.contains('section-toggle')) {
        return;
      }
      
      const section = this.closest('.report-section');
      if (section) {
        toggleSection(section.id);
      }
    });
  });
  
  // Toggle button handlers
  elements.sectionToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const section = this.closest('.report-section');
      if (section) {
        toggleSection(section.id);
      }
    });
  });
  
  console.log('Section toggle functionality initialized');
}

function toggleSection(sectionId) {
  if (appState.collapsedSections.has(sectionId)) {
    expandSection(sectionId);
  } else {
    collapseSection(sectionId);
  }
}

function collapseSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const content = section.querySelector('.section-content');
  const toggle = section.querySelector('.section-toggle');
  
  if (content) {
    content.style.display = 'none';
    content.classList.add('collapsed');
  }
  
  if (toggle) {
    toggle.textContent = 'Expand';
  }
  
  appState.collapsedSections.add(sectionId);
  console.log(`Section ${sectionId} collapsed`);
}

function expandSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const content = section.querySelector('.section-content');
  const toggle = section.querySelector('.section-toggle');
  
  if (content) {
    content.style.display = 'block';
    content.classList.remove('collapsed');
  }
  
  if (toggle) {
    toggle.textContent = 'Collapse';
  }
  
  appState.collapsedSections.delete(sectionId);
  console.log(`Section ${sectionId} expanded`);
}

function expandAllSections() {
  elements.sections.forEach(section => {
    if (appState.collapsedSections.has(section.id)) {
      expandSection(section.id);
    }
  });
  showNotification('All sections expanded', 'info');
}

function collapseAllSections() {
  elements.sections.forEach(section => {
    if (!appState.collapsedSections.has(section.id)) {
      collapseSection(section.id);
    }
  });
  showNotification('All sections collapsed', 'info');
}

// Progress tracking functionality
function setupProgressTracking() {
  // Scroll event handler with throttling
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateReadingProgress, 10);
  });
  
  // Initial progress update
  updateReadingProgress();
  
  console.log('Progress tracking initialized');
}

function updateReadingProgress() {
  if (!elements.progressFill || !elements.progressText) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  
  if (scrollHeight > 0) {
    const scrollPercent = Math.max(0, Math.min(100, (scrollTop / scrollHeight) * 100));
    
    elements.progressFill.style.width = scrollPercent + '%';
    elements.progressText.textContent = Math.round(scrollPercent) + '% Complete';
  } else {
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0% Complete';
  }
}

// Print functionality
function setupPrintFunctionality() {
  // Setup print event handlers
  window.addEventListener('beforeprint', handleBeforePrint);
  window.addEventListener('afterprint', handleAfterPrint);
  
  console.log('Print functionality initialized');
}

function printReport() {
  // Store current state
  const previousCollapsedSections = new Set(appState.collapsedSections);
  
  // Clear search highlights for clean printing
  clearSearchHighlights();
  
  // Expand all sections for complete printing
  expandAllSections();
  
  // Trigger print
  window.print();
  
  // Restore previous state after a short delay
  setTimeout(() => {
    previousCollapsedSections.forEach(sectionId => {
      collapseSection(sectionId);
    });
  }, 100);
}

function handleBeforePrint() {
  // Additional print preparation if needed
  console.log('Preparing for print...');
}

function handleAfterPrint() {
  // Post-print cleanup if needed
  console.log('Print completed');
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyboardShortcuts);
  console.log('Keyboard shortcuts initialized');
}

function handleKeyboardShortcuts(e) {
  // Only activate shortcuts when not typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  switch(e.key) {
    case 'f':
    case 'F':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        focusSearch();
      }
      break;
      
    case 'Escape':
      if (appState.isSearching) {
        clearSearch();
      }
      break;
      
    case 'ArrowDown':
      if (e.altKey) {
        e.preventDefault();
        navigateToNextSection();
      }
      break;
      
    case 'ArrowUp':
      if (e.altKey) {
        e.preventDefault();
        navigateToPreviousSection();
      }
      break;
      
    case 'p':
    case 'P':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        printReport();
      }
      break;
      
    case ' ':
      if (e.shiftKey) {
        e.preventDefault();
        // Page up behavior
        window.scrollBy(0, -window.innerHeight * 0.8);
      } else if (!e.target.closest('input, textarea, button')) {
        e.preventDefault();
        // Page down behavior
        window.scrollBy(0, window.innerHeight * 0.8);
      }
      break;
  }
}

function focusSearch() {
  if (elements.searchInput) {
    elements.searchInput.focus();
    elements.searchInput.select();
  }
}

function navigateToNextSection() {
  const sections = ['executive-summary', 'clinical-data', 'renal-principles', 'hepatic-support', 
                   'co-occurring-conditions', 'synthesized-plan', 'dietary-claims', 'nutraceuticals'];
  const currentIndex = sections.indexOf(appState.currentSection);
  
  if (currentIndex < sections.length - 1) {
    const nextSection = sections[currentIndex + 1];
    scrollToSection(nextSection);
    updateActiveNavLink(nextSection);
  }
}

function navigateToPreviousSection() {
  const sections = ['executive-summary', 'clinical-data', 'renal-principles', 'hepatic-support', 
                   'co-occurring-conditions', 'synthesized-plan', 'dietary-claims', 'nutraceuticals'];
  const currentIndex = sections.indexOf(appState.currentSection);
  
  if (currentIndex > 0) {
    const prevSection = sections[currentIndex - 1];
    scrollToSection(prevSection);
    updateActiveNavLink(prevSection);
  }
}

// Mobile-specific features
function setupMobileFeatures() {
  // Handle mobile navigation
  setupMobileNavigation();
  
  // Handle touch gestures for section navigation
  setupTouchGestures();
  
  console.log('Mobile features initialized');
}

function setupMobileNavigation() {
  // Close sidebar when clicking on mobile nav links
  if (window.innerWidth <= 1024) {
    elements.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Add mobile-specific behavior if needed
        setTimeout(updateReadingProgress, 100);
      });
    });
  }
}

function setupTouchGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchend', function(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Only trigger if it's a clear horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        // Swipe left - next section
        navigateToNextSection();
      } else {
        // Swipe right - previous section
        navigateToPreviousSection();
      }
    }
    
    // Reset
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    transform: translateX(100%);
    font-family: var(--font-family-base);
    font-size: var(--font-size-sm);
  `;
  
  // Set background color based on type
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });
  
  // Remove after duration
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Handle window resize for responsive features
window.addEventListener('resize', debounce(function() {
  // Recalculate progress on resize
  updateReadingProgress();
  
  // Update mobile features if needed
  if (window.innerWidth <= 1024) {
    setupMobileNavigation();
  }
}, 250));

// Handle page visibility change (for performance optimization)
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Page is now hidden, pause any animations or timers if needed
    console.log('Page hidden');
  } else {
    // Page is now visible, resume normal operation
    console.log('Page visible');
    updateReadingProgress();
  }
});

// Export functions to global scope for HTML onclick handlers
window.printReport = printReport;
window.expandAllSections = expandAllSections;
window.collapseAllSections = collapseAllSections;
window.toggleSection = toggleSection;

// Initialize smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', function() {
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        scrollToSection(targetId);
      }
    });
  });
});

// Performance monitoring (optional)
if ('performance' in window) {
  window.addEventListener('load', function() {
    setTimeout(function() {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log(`Page load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
    }, 0);
  });
}

console.log('Gemini Report JavaScript loaded successfully');