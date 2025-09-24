// Dashboard Data
const bloodworkData = {
  "Glucose": { value: 90, range: "70-115", unit: "mg/dL", status: "normal" },
  "BUN": { value: 43, range: "7-30", unit: "mg/dL", status: "elevated" },
  "Creatinine": { value: 2.12, range: "0.6-1.6", unit: "mg/dL", status: "elevated" },
  "Phosphorus": { value: 4.2, range: "2.5-6.0", unit: "mg/dL", status: "upper_normal" },
  "Calcium": { value: 13.3, range: "9.0-11.5", unit: "mg/dL", status: "elevated" },
  "Magnesium": { value: 2.3, range: "1.8-2.4", unit: "mg/dL", status: "normal" },
  "Total Protein": { value: 6.5, range: "5.0-7.0", unit: "g/dL", status: "normal" },
  "Albumin": { value: 3.5, range: "3.0-4.3", unit: "g/dL", status: "normal" },
  "Globulin": { value: 3.0, range: "1.5-3.2", unit: "g/dL", status: "normal" },
  "Cholesterol": { value: 461, range: "130-300", unit: "mg/dL", status: "elevated" },
  "CK": { value: 266, range: "50-275", unit: "IU/L", status: "normal" },
  "T.Bilirubin": { value: 0.1, range: "0.0-0.2", unit: "mg/dL", status: "normal" },
  "ALP": { value: 495, range: "15-140", unit: "IU/L", status: "severely_elevated" },
  "ALT": { value: 308, range: "10-90", unit: "IU/L", status: "severely_elevated" },
  "AST": { value: 52, range: "15-45", unit: "IU/L", status: "elevated" },
  "GGT": { value: 28, range: "0-9", unit: "IU/L", status: "elevated" }
};

// Application State
let appState = {
  research: {
    research1: '',
    research2: '',
    research3: ''
  },
  veterinary: {
    primary: {},
    emergency: {},
    medications: [],
    appointments: []
  },
  geminiReport: {
    searchTerm: '',
    currentSection: 'executive-summary',
    collapsedSections: new Set()
  }
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// Initialize Application
function initializeApp() {
  console.log('Initializing app...');
  setupTabNavigation();
  populateBloodworkTable();
  loadStoredData();
  setupFormHandlers();
  setupGeminiReport();
  console.log('App initialized');
}

// Tab Navigation
function setupTabNavigation() {
  console.log('Setting up tab navigation...');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  console.log('Found', tabButtons.length, 'tab buttons and', tabContents.length, 'tab contents');

  tabButtons.forEach((button, index) => {
    console.log('Setting up button', index, 'with data-tab:', button.getAttribute('data-tab'));
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Tab button clicked:', button.getAttribute('data-tab'));
      
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Add active class to corresponding content
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('Activated tab:', targetTab);
        
        // Initialize Gemini Report features if that tab is selected
        if (targetTab === 'gemini-report') {
          initializeGeminiReportFeatures();
        }
      } else {
        console.error('Could not find target content:', targetTab);
      }
    });
  });
}

// Gemini Report Setup
function setupGeminiReport() {
  console.log('Setting up Gemini Report...');
  
  // Setup search functionality
  const searchInput = document.getElementById('report-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleReportSearch);
  }
  
  // Setup section navigation
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      scrollToSection(targetId);
      updateActiveNavLink(targetId);
    });
  });
  
  // Setup section toggles - Fixed version
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    header.addEventListener('click', function(e) {
      // Prevent triggering when clicking the toggle button specifically
      if (e.target.classList.contains('section-toggle')) {
        return;
      }
      const section = this.closest('.report-section');
      if (section) {
        toggleSection(section.id);
      }
    });
  });
  
  // Setup toggle buttons
  const toggleButtons = document.querySelectorAll('.section-toggle');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const section = this.closest('.report-section');
      if (section) {
        toggleSection(section.id);
      }
    });
  });
  
  // Setup scroll tracking for progress
  const reportContent = document.querySelector('.report-content');
  if (reportContent) {
    reportContent.addEventListener('scroll', updateReadingProgress);
  }
  
  // Setup window scroll tracking as fallback
  window.addEventListener('scroll', updateReadingProgress);
}

function initializeGeminiReportFeatures() {
  console.log('Initializing Gemini Report features...');
  
  // Reset progress
  updateReadingProgress();
  
  // Ensure first section is active
  updateActiveNavLink('executive-summary');
  
  // Setup intersection observer for section tracking
  setupSectionObserver();
}

// Search Functionality
function handleReportSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  appState.geminiReport.searchTerm = searchTerm;
  
  if (searchTerm.length > 2) {
    highlightSearchResults(searchTerm);
  } else {
    clearSearchHighlights();
  }
}

function highlightSearchResults(searchTerm) {
  const reportSections = document.querySelectorAll('.section-content');
  let foundResults = false;
  
  reportSections.forEach(section => {
    const content = section.innerHTML;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    
    if (content.toLowerCase().includes(searchTerm)) {
      foundResults = true;
      const highlightedContent = content.replace(regex, '<mark>$1</mark>');
      section.innerHTML = highlightedContent;
      
      // Expand section if it contains search results
      const reportSection = section.closest('.report-section');
      if (reportSection && appState.geminiReport.collapsedSections.has(reportSection.id)) {
        expandSection(reportSection.id);
      }
    }
  });
  
  if (!foundResults) {
    showNotification('No results found for "' + searchTerm + '"', 'info');
  }
}

function clearSearchHighlights() {
  const marks = document.querySelectorAll('.section-content mark');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// Section Navigation
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Expand section if collapsed
    if (appState.geminiReport.collapsedSections.has(sectionId)) {
      expandSection(sectionId);
    }
    
    // Smooth scroll to section
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Update current section
    appState.geminiReport.currentSection = sectionId;
  }
}

function updateActiveNavLink(sectionId) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + sectionId) {
      link.classList.add('active');
    }
  });
}

// Section Collapse/Expand - Fixed version
function toggleSection(sectionId) {
  console.log('Toggling section:', sectionId);
  
  if (appState.geminiReport.collapsedSections.has(sectionId)) {
    expandSection(sectionId);
  } else {
    collapseSection(sectionId);
  }
}

function collapseSection(sectionId) {
  console.log('Collapsing section:', sectionId);
  
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const content = section.querySelector('.section-content');
  const toggle = section.querySelector('.section-toggle');
  
  if (content) {
    content.style.display = 'none';
  }
  if (toggle) {
    toggle.textContent = 'Expand';
  }
  
  appState.geminiReport.collapsedSections.add(sectionId);
}

function expandSection(sectionId) {
  console.log('Expanding section:', sectionId);
  
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const content = section.querySelector('.section-content');
  const toggle = section.querySelector('.section-toggle');
  
  if (content) {
    content.style.display = 'block';
  }
  if (toggle) {
    toggle.textContent = 'Collapse';
  }
  
  appState.geminiReport.collapsedSections.delete(sectionId);
}

// Reading Progress
function updateReadingProgress() {
  const reportContent = document.querySelector('.report-content');
  const progressFill = document.getElementById('reading-progress');
  const progressText = document.getElementById('progress-text');
  
  if (!reportContent || !progressFill || !progressText) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  
  if (scrollHeight > 0) {
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    const clampedPercent = Math.max(0, Math.min(100, scrollPercent));
    
    progressFill.style.width = clampedPercent + '%';
    progressText.textContent = Math.round(clampedPercent) + '% Complete';
  }
}

// Section Observer for Auto-Navigation
function setupSectionObserver() {
  const sections = document.querySelectorAll('.report-section');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        updateActiveNavLink(entry.target.id);
        appState.geminiReport.currentSection = entry.target.id;
      }
    });
  }, {
    threshold: [0.1, 0.5, 0.9],
    rootMargin: '-20px 0px -20px 0px'
  });
  
  sections.forEach(section => observer.observe(section));
}

// Print Report Functionality
function printReport() {
  // Expand all sections before printing
  const collapsedSections = Array.from(appState.geminiReport.collapsedSections);
  collapsedSections.forEach(sectionId => expandSection(sectionId));
  
  // Clear search highlights
  clearSearchHighlights();
  
  // Trigger print
  window.print();
  
  // Restore collapsed sections after print
  setTimeout(() => {
    collapsedSections.forEach(sectionId => collapseSection(sectionId));
  }, 100);
}

// Populate Bloodwork Results Table
function populateBloodworkTable() {
  const tbody = document.getElementById('bloodwork-results');
  if (!tbody) {
    console.warn('Bloodwork results table not found');
    return;
  }
  
  console.log('Populating bloodwork table...');
  tbody.innerHTML = '';
  
  Object.entries(bloodworkData).forEach(([testName, data]) => {
    const row = document.createElement('tr');
    
    const statusClass = getStatusClass(data.status);
    const statusText = getStatusText(data.status);
    
    row.innerHTML = `
      <td class="test-name">${testName}</td>
      <td class="result-value">${data.value} ${data.unit}</td>
      <td class="reference-range">${data.range} ${data.unit}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    `;
    
    tbody.appendChild(row);
  });
  console.log('Bloodwork table populated with', Object.keys(bloodworkData).length, 'entries');
}

// Get Status Class for Styling
function getStatusClass(status) {
  const statusMap = {
    'normal': 'normal',
    'elevated': 'elevated',
    'severely_elevated': 'severe',
    'upper_normal': 'upper_normal'
  };
  return statusMap[status] || 'normal';
}

// Get Human-Readable Status Text
function getStatusText(status) {
  const statusMap = {
    'normal': 'Normal',
    'elevated': 'Elevated',
    'severely_elevated': 'Severely Elevated',
    'upper_normal': 'Upper Normal'
  };
  return statusMap[status] || 'Normal';
}

// Research Report Functions
function saveResearch(reportId) {
  console.log('Saving research for:', reportId);
  const textarea = document.getElementById(`${reportId}-content`);
  const display = document.getElementById(`${reportId}-display`);
  
  if (!textarea || !display) {
    console.error('Could not find textarea or display for:', reportId);
    return;
  }
  
  const content = textarea.value.trim();
  
  if (content) {
    appState.research[reportId] = content;
    display.textContent = content;
    display.classList.add('has-content');
    textarea.style.display = 'none';
    
    // Save to session storage for persistence during session
    saveToSession();
    
    // Show success message
    showNotification('Research report saved successfully!', 'success');
    console.log('Research saved for:', reportId);
  } else {
    showNotification('Please enter some content before saving.', 'warning');
  }
}

// Veterinary Contact Functions
function saveVetInfo() {
  const vetInfo = {
    name: document.getElementById('vet-name').value,
    clinic: document.getElementById('vet-clinic').value,
    phone: document.getElementById('vet-phone').value,
    email: document.getElementById('vet-email').value,
    notes: document.getElementById('vet-notes').value
  };
  
  if (vetInfo.name || vetInfo.clinic || vetInfo.phone) {
    appState.veterinary.primary = vetInfo;
    saveToSession();
    showNotification('Veterinary contact information saved!', 'success');
  } else {
    showNotification('Please fill in at least name, clinic, or phone number.', 'warning');
  }
}

function saveEmergencyInfo() {
  const emergencyInfo = {
    clinic: document.getElementById('emergency-clinic').value,
    phone: document.getElementById('emergency-phone').value,
    hours: document.getElementById('emergency-hours').value
  };
  
  if (emergencyInfo.clinic || emergencyInfo.phone) {
    appState.veterinary.emergency = emergencyInfo;
    saveToSession();
    showNotification('Emergency contact information saved!', 'success');
  } else {
    showNotification('Please fill in at least clinic name or phone number.', 'warning');
  }
}

// Medication Management
function addMedication() {
  const name = document.getElementById('med-name').value.trim();
  const dosage = document.getElementById('med-dosage').value.trim();
  const frequency = document.getElementById('med-frequency').value.trim();
  
  if (!name || !dosage || !frequency) {
    showNotification('Please fill in all medication fields.', 'warning');
    return;
  }
  
  const medication = {
    id: Date.now(),
    name,
    dosage,
    frequency,
    dateAdded: new Date().toLocaleDateString()
  };
  
  appState.veterinary.medications.push(medication);
  
  // Clear form
  document.getElementById('med-name').value = '';
  document.getElementById('med-dosage').value = '';
  document.getElementById('med-frequency').value = '';
  
  renderMedications();
  saveToSession();
  showNotification('Medication added successfully!', 'success');
}

function removeMedication(id) {
  appState.veterinary.medications = appState.veterinary.medications.filter(med => med.id !== id);
  renderMedications();
  saveToSession();
  showNotification('Medication removed.', 'info');
}

function renderMedications() {
  const container = document.getElementById('medication-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  appState.veterinary.medications.forEach(medication => {
    const medicationItem = document.createElement('div');
    medicationItem.className = 'medication-item';
    medicationItem.innerHTML = `
      <div class="medication-info">
        <div class="medication-name">${medication.name}</div>
        <div class="medication-details">
          ${medication.dosage} - ${medication.frequency}<br>
          Added: ${medication.dateAdded}
        </div>
      </div>
      <button class="remove-btn" onclick="removeMedication(${medication.id})">Remove</button>
    `;
    container.appendChild(medicationItem);
  });
}

// Appointment Management
function addAppointment() {
  const date = document.getElementById('appt-date').value;
  const time = document.getElementById('appt-time').value;
  const reason = document.getElementById('appt-reason').value.trim();
  
  console.log('Adding appointment:', { date, time, reason });
  
  if (!date || !time || !reason) {
    showNotification('Please fill in all appointment fields.', 'warning');
    return;
  }
  
  // Validate date format
  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    showNotification('Please enter a valid date.', 'warning');
    return;
  }
  
  const appointment = {
    id: Date.now(),
    date,
    time,
    reason,
    dateAdded: new Date().toLocaleDateString()
  };
  
  appState.veterinary.appointments.push(appointment);
  
  // Clear form
  document.getElementById('appt-date').value = '';
  document.getElementById('appt-time').value = '';
  document.getElementById('appt-reason').value = '';
  
  renderAppointments();
  saveToSession();
  showNotification('Appointment added successfully!', 'success');
}

function removeAppointment(id) {
  appState.veterinary.appointments = appState.veterinary.appointments.filter(appt => appt.id !== id);
  renderAppointments();
  saveToSession();
  showNotification('Appointment removed.', 'info');
}

function renderAppointments() {
  const container = document.getElementById('appointment-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Sort appointments by date
  const sortedAppointments = appState.veterinary.appointments.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA - dateB;
  });
  
  sortedAppointments.forEach(appointment => {
    const appointmentItem = document.createElement('div');
    appointmentItem.className = 'appointment-item';
    
    // Format date and time more safely
    const formattedDate = new Date(appointment.date).toLocaleDateString();
    const timeString = appointment.time;
    
    appointmentItem.innerHTML = `
      <div class="appointment-info">
        <div class="appointment-date">${formattedDate} at ${timeString}</div>
        <div class="appointment-details">
          ${appointment.reason}<br>
          Scheduled: ${appointment.dateAdded}
        </div>
      </div>
      <button class="remove-btn" onclick="removeAppointment(${appointment.id})">Remove</button>
    `;
    container.appendChild(appointmentItem);
  });
}

// Form Handlers Setup
function setupFormHandlers() {
  // Add enter key handlers for forms
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    if (input.type !== 'date' && input.type !== 'time') {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Find the associated button and click it
          const form = input.closest('.contact-form, .medication-input, .appointment-input');
          if (form) {
            const button = form.querySelector('.btn');
            if (button) button.click();
          }
        }
      });
    }
  });
}

// Data Persistence
function saveToSession() {
  try {
    // Note: We can't use localStorage in the sandbox, so this is just for the session
    // In a real application, this would save to localStorage or a backend
    console.log('Data would be saved:', appState);
  } catch (error) {
    console.warn('Could not save data:', error);
  }
}

function loadStoredData() {
  try {
    // In a real application, this would load from localStorage or a backend
    // For now, we'll just initialize with empty data
    renderMedications();
    renderAppointments();
    
    // Load any research content that might have been saved
    Object.keys(appState.research).forEach(reportId => {
      const content = appState.research[reportId];
      if (content) {
        const display = document.getElementById(`${reportId}-display`);
        const textarea = document.getElementById(`${reportId}-content`);
        if (display && textarea) {
          display.textContent = content;
          display.classList.add('has-content');
          textarea.style.display = 'none';
        }
      }
    });
  } catch (error) {
    console.warn('Could not load stored data:', error);
  }
}

// Notification System
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    transform: translateX(100%);
  `;
  
  // Set background color based on type
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Utility Functions
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(time) {
  return new Date(`1970-01-01 ${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Export functions to global scope for onclick handlers
window.saveResearch = saveResearch;
window.saveVetInfo = saveVetInfo;
window.saveEmergencyInfo = saveEmergencyInfo;
window.addMedication = addMedication;
window.removeMedication = removeMedication;
window.addAppointment = addAppointment;
window.removeAppointment = removeAppointment;
window.toggleSection = toggleSection;
window.printReport = printReport;

// Additional utility for research reports - allow editing
function editResearch(reportId) {
  const textarea = document.getElementById(`${reportId}-content`);
  const display = document.getElementById(`${reportId}-display`);
  
  if (textarea && display) {
    textarea.style.display = 'block';
    display.classList.remove('has-content');
    textarea.focus();
  }
}

window.editResearch = editResearch;

// Handle research display clicks to enable editing
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('research-display') && e.target.classList.contains('has-content')) {
    const reportId = e.target.id.replace('-display', '');
    editResearch(reportId);
  }
});

// Print functionality enhancement
function printSection(sectionId) {
  const originalContent = document.body.innerHTML;
  const section = document.getElementById(sectionId);
  
  if (section) {
    const printContent = `
      <html>
        <head>
          <title>Carmelo's Health Dashboard - ${section.querySelector('h2').textContent}</title>
          <link rel="stylesheet" href="style.css">
          <style>
            @media print {
              .tab-navigation, .print-btn, .btn { display: none !important; }
              body { background: white !important; }
            }
          </style>
        </head>
        <body>
          <div class="dashboard-container">
            <header class="dashboard-header">
              <div class="container">
                <h1>🐕 Carmelo's Health Dashboard</h1>
                <div class="dog-info">
                  <span class="dog-breed">Norwegian Elkhound Mix</span>
                  <span class="dog-age">Senior (15+ years)</span>
                  <span class="dog-weight">55 lbs</span>
                </div>
              </div>
            </header>
            <main class="dashboard-content">
              <div class="container">
                ${section.outerHTML}
              </div>
            </main>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
}

// Keyboard shortcuts for Gemini Report
document.addEventListener('keydown', function(e) {
  // Only activate shortcuts when Gemini Report tab is active
  const geminiTab = document.getElementById('gemini-report');
  if (!geminiTab || !geminiTab.classList.contains('active')) return;
  
  // Ctrl/Cmd + F for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('report-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Escape to clear search
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('report-search');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      clearSearchHighlights();
      appState.geminiReport.searchTerm = '';
    }
  }
  
  // Arrow keys for section navigation
  if (e.key === 'ArrowDown' && e.altKey) {
    e.preventDefault();
    navigateToNextSection();
  }
  
  if (e.key === 'ArrowUp' && e.altKey) {
    e.preventDefault();
    navigateToPreviousSection();
  }
});

// Section Navigation Helper Functions
function navigateToNextSection() {
  const sections = ['executive-summary', 'clinical-data', 'renal-principles', 'hepatic-support', 
                   'co-occurring-conditions', 'synthesized-plan', 'dietary-claims', 'nutraceuticals'];
  const currentIndex = sections.indexOf(appState.geminiReport.currentSection);
  
  if (currentIndex < sections.length - 1) {
    const nextSection = sections[currentIndex + 1];
    scrollToSection(nextSection);
    updateActiveNavLink(nextSection);
  }
}

function navigateToPreviousSection() {
  const sections = ['executive-summary', 'clinical-data', 'renal-principles', 'hepatic-support', 
                   'co-occurring-conditions', 'synthesized-plan', 'dietary-claims', 'nutraceuticals'];
  const currentIndex = sections.indexOf(appState.geminiReport.currentSection);
  
  if (currentIndex > 0) {
    const prevSection = sections[currentIndex - 1];
    scrollToSection(prevSection);
    updateActiveNavLink(prevSection);
  }
}

// Initialize scroll tracking when page loads
window.addEventListener('load', function() {
  // Set up scroll tracking for reading progress
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateReadingProgress, 10);
  });
});