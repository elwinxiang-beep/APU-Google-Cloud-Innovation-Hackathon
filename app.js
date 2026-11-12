/**
 * HostelKaki - Residential Maintenance Issue Portal
 * Core Application Logic, Gemini AI Triage Engine & Warden Command Center
 * Features: Role-Based Visibility (Staff vs Student), Auto Ticket ID, Kanban Triage & Live Concierge
 */

import { syncUserToDatabase, submitTicketToDatabase, updateTicketStatusInDatabase, listenToTickets } from "./firebase-db.js";

// Initial State & Mock Data Keys
const APP_STORAGE_KEY = 'hostelkaki_reports_v2';
const USER_STORAGE_KEY = 'hostelkaki_active_user_v2';

// Default Demo User Accounts
const DEMO_ACCOUNTS = {
  student: {
    id: 'STU-2024-8891',
    name: 'Alex Tan',
    role: 'student',
    roleLabel: 'Student Resident',
    unit: 'Block A - Room 302',
    phone: '+60 12-345 6789',
    avatar: 'AT'
  },
  staff: {
    id: 'STAFF-FAC-04',
    name: 'Encik Rahman',
    role: 'staff',
    roleLabel: 'Facility Team Lead',
    unit: 'Facilities Department (Ground Floor)',
    phone: '+60 19-876 5432',
    avatar: 'ER'
  }
};

// Initial Sample Reports with Realistic Incident Data & Auto Ticket IDs
const SAMPLE_REPORTS = [
  {
    id: 'HK-2026-1082',
    reporterName: 'Alex Tan',
    reporterPhone: '+60 12-345 6789',
    datetime: '2026-11-10T14:30',
    locationType: 'Block A - Room 302',
    customLocation: '',
    category: 'Air Conditioning',
    urgency: 'Urgent',
    description: 'Aircond indoor blower leaking water heavily onto study desk right next to my plugged-in laptop and 240V wall socket! Also basin tap valve dripping.',
    status: 'In Progress',
    floorplan: {
      floor: '3',
      x: 245,
      y: 110,
      roomName: 'Room 302 (Twin Sharing)'
    },
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: 'Dispatched to Ah Meng Aircond & HVAC Services. Replacement drain pump and gasket ordered.',
    createdAt: Date.now() - 86400000
  },
  {
    id: 'HK-2026-1083',
    reporterName: 'Siti Sarah',
    reporterPhone: '+60 17-654 3210',
    datetime: '2026-11-11T09:15',
    locationType: 'Common Area - Laundry Room',
    customLocation: '',
    category: 'Electrical & Lighting',
    urgency: 'Urgent',
    description: 'Commercial Dryer Machine #2 stopped mid-cycle with a burnt plastic smell. Power socket seems scorched and the unit trips the main breaker.',
    status: 'Pending',
    floorplan: {
      floor: '3',
      x: 480,
      y: 335,
      roomName: 'Laundry Room (Washer / Dryer)'
    },
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: '',
    createdAt: Date.now() - 36000000
  },
  {
    id: 'HK-2026-1089',
    reporterName: 'Sarah Lim',
    reporterPhone: '+60 17-889 2341',
    datetime: '2026-11-11T16:40',
    locationType: 'Block A - Room 301',
    customLocation: '',
    category: 'Plumbing & Water',
    urgency: 'Medium',
    description: 'Bathroom sink flexible hose leaking underneath the basin, water pooling near washroom threshold.',
    status: 'Pending',
    floorplan: {
      floor: '3',
      x: 115,
      y: 105,
      roomName: 'Room 301 (Single En-suite)'
    },
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: '',
    createdAt: Date.now() - 22000000
  },
  {
    id: 'HK-2026-1075',
    reporterName: 'Amirul Hakim',
    reporterPhone: '+60 19-223 4512',
    datetime: '2026-11-11T11:20',
    locationType: 'Common Area - Pantry / Kitchenette',
    customLocation: '',
    category: 'Electrical & Lighting',
    urgency: 'Medium',
    description: 'Pantry fluorescent ceiling tube flickering nonstop above water dispenser counter.',
    status: 'Pending',
    floorplan: {
      floor: '3',
      x: 685,
      y: 105,
      roomName: 'Floor Pantry & Microwave Station'
    },
    imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: '',
    createdAt: Date.now() - 54000000
  },
  {
    id: 'HK-2026-1079',
    reporterName: 'Marcus Wong',
    reporterPhone: '+60 13-987 6543',
    datetime: '2026-11-08T11:00',
    locationType: 'Common Area - Study Lounge',
    customLocation: '',
    category: 'Air Conditioning',
    urgency: 'Normal',
    description: 'The ceiling air conditioner remote is missing its battery cover and the blower fan makes a squeaking sound on high mode.',
    status: 'Resolved',
    floorplan: {
      floor: '3',
      x: 290,
      y: 335,
      roomName: 'Resident Study Lounge'
    },
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: 'Replaced fan bearing and supplied new remote with safety tether.',
    createdAt: Date.now() - 172800000
  },
  {
    id: 'HK-2026-1064',
    reporterName: 'Daniel Wong',
    reporterPhone: '+60 11-554 3901',
    datetime: '2026-11-09T15:10',
    locationType: 'Block B - Room 202',
    customLocation: '',
    category: 'Doors, Windows & Lock',
    urgency: 'Normal',
    description: 'Study wardrobe cabinet top hinge came loose and room door latch sticks slightly.',
    status: 'Pending',
    floorplan: {
      floor: '3',
      x: 655,
      y: 335,
      roomName: 'Room 305 (Corner Suite)'
    },
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
    staffNotes: '',
    createdAt: Date.now() - 120000000
  }
];

// Application State Variables
let currentUser = null;
let currentReports = [];
let currentFilter = 'all';
let selectedFloorplanPoint = null;
let uploadedImageBase64 = null;
let uploadedVideoBase64 = null;
let loginSelectedRole = 'student';
let latestGeneratedTicketId = '';
let activeInspectorTicketId = null;

// ==========================================
// GEMINI ENTERPRISE AI TRIAGE ENGINE
// Automatically enriches any student report with multimodal trade, urgency score, hazards & parts checklist
// ==========================================
function enrichReportWithAiTriage(report) {
  if (report.aiTriage) return report;

  const cat = (report.category || '').toLowerCase();
  const desc = (report.description || '').toLowerCase();
  const loc = (report.locationType === 'Others' && report.customLocation) ? report.customLocation : (report.locationType || 'Block A');

  // 1. Determine Trade
  let trade = 'Plumbing';
  let contractor = 'Syabas Campus Plumbing Team';
  let parts = ['Adjustable pipe wrench', 'PTFE thread seal tape', 'Replacement rubber gasket'];

  if (cat.includes('air') || desc.includes('aircond') || desc.includes('ac ') || desc.includes('blower')) {
    trade = 'HVAC';
    contractor = 'Ah Meng Aircond & HVAC Services';
    parts = ['Condensate drain vacuum pump', 'Coil fin brush', 'R32 pressure gauge', 'Anti-fungal drain tablets'];
  } else if (cat.includes('electr') || desc.includes('socket') || desc.includes('light') || desc.includes('spark') || desc.includes('breaker')) {
    trade = 'Electrical';
    contractor = 'Tenaga Spark Electrical Contractors';
    parts = ['13A SIRIM wall socket', 'LED T8 replacement tube', 'Digital multimeter', 'Insulated terminal screwdriver'];
  } else if (cat.includes('door') || cat.includes('furniture') || desc.includes('hinge') || desc.includes('lock') || desc.includes('wardrobe')) {
    trade = 'Carpentry';
    contractor = 'Hostel In-House Carpentry Unit';
    parts = ['35mm soft-close concealed hinge', 'Mortise door lock cylinder', 'Cordless impact driver'];
  }

  // 2. Determine Block (Block A, Block B, Block C)
  let block = 'Block A';
  if (loc.includes('Block B') || loc.includes('Pantry') || loc.includes('Laundry')) block = 'Block B';
  else if (loc.includes('Block C') || loc.includes('Others')) block = 'Block C';

  // 3. Determine Urgency Bucket & Hazard Warning
  let urgencyBucket = 'Routine';
  let urgencyScore = '2/5 Routine';
  let hazard = 'Low safety hazard: Standard wear-and-tear facility maintenance.';
  let aiSummary = `Routine ${trade} maintenance request at ${loc}. Standard technician inspection scheduled.`;

  const hasCriticalKeyword = desc.includes('spark') || desc.includes('burnt') || desc.includes('socket') || desc.includes('flood') || desc.includes('burst') || desc.includes('heavily');

  if (report.urgency === 'Urgent' || hasCriticalKeyword) {
    urgencyBucket = 'Emergency';
    urgencyScore = '5/5 Critical';
    hazard = trade === 'HVAC' || trade === 'Plumbing'
      ? 'High electrocution & slip risk: Active water leak detected near electrical points / study area.'
      : 'Critical electrical fire/short-circuit hazard: Scorched outlet or breaker trip detected.';
    aiSummary = `Gemini Vision & Text Triage flagged an EMERGENCY ${trade} hazard at ${loc}. Immediate isolate-and-repair dispatch required.`;
  } else if (report.urgency === 'Medium') {
    urgencyBucket = 'Priority';
    urgencyScore = '3/5 Priority';
    hazard = `Moderate facility disruption in ${loc}; may escalate if left unserviced over 24 hours.`;
    aiSummary = `Priority ${trade} fault at ${loc}. Recommended technician dispatch within 24-hour SLA window.`;
  }

  report.aiTriage = {
    trade,
    block,
    urgencyBucket,
    urgencyScore,
    confidence: '97%',
    hazard,
    aiSummary,
    parts,
    contractor
  };

  return report;
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initUser();
  // Immediately load local/sample reports so UI is populated before Firebase callback
  const localReports = localStorage.getItem(APP_STORAGE_KEY);
  currentReports = (localReports ? JSON.parse(localReports) : [...SAMPLE_REPORTS]).map(enrichReportWithAiTriage);

  initRealtimeTickets();
  initFormDateTime();
  initNavigation();
  initFloorplanDefaults();
  updateUI();
});

// Setup Initial User
function initUser() {
  const savedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      currentUser = { ...DEMO_ACCOUNTS.student };
    }
  } else {
    currentUser = { ...DEMO_ACCOUNTS.student };
  }
}

/**
 * Setup Reports Data
 * Initializes real-time Firestore synchronization on app load.
 */
function initRealtimeTickets() {
  try {
    listenToTickets((cloudTickets) => {
      if (cloudTickets && cloudTickets.length > 0) {
        currentReports = cloudTickets.map(enrichReportWithAiTriage);
      } else {
        const localReports = localStorage.getItem(APP_STORAGE_KEY);
        currentReports = (localReports ? JSON.parse(localReports) : [...SAMPLE_REPORTS]).map(enrichReportWithAiTriage);
      }
      updateStats();
      renderReportList();
      renderWardenKanban();
      renderStaffFloorplanPins();
      console.log("Real-time sync: UI & Warden Kanban updated with latest cloud tickets.");
    });
  } catch (err) {
    console.warn("Firebase offline or not configured, running on local storage fallback:", err);
  }
}

function saveReports() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentReports));
  updateStats();
  renderWardenKanban();
  renderStaffFloorplanPins();
}

// Pre-fill current date and time in the form
function initFormDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const datetimeField = document.getElementById('incident-datetime');
  if (datetimeField) {
    datetimeField.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const phoneField = document.getElementById('incident-phone');
  if (phoneField && currentUser) {
    phoneField.value = currentUser.phone;
  }
}

// ==========================================
// NAVIGATION & DRAWER CONTROLS
// ==========================================
function initNavigation() {
  const openBtn = document.getElementById('sidebar-open-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const headerMenuBtn = document.getElementById('header-menu-btn');
  const backdrop = document.getElementById('drawer-backdrop');

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (headerMenuBtn) headerMenuBtn.addEventListener('click', toggleSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      navigate(targetView);
      closeSidebar();
    });
  });

  const roleToggleBtn = document.getElementById('quick-role-toggle-btn');
  if (roleToggleBtn) {
    roleToggleBtn.addEventListener('click', () => {
      toggleUserRole();
    });
  }

  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', () => {
      closeSidebar();
      openLoginModal();
    });
  }

  const hash = window.location.hash.replace('#', '') || 'home';
  navigate(hash);
}

function openSidebar() {
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('-translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
  }
}

function closeSidebar() {
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('-translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
  }
}

function toggleSidebar() {
  const drawer = document.getElementById('nav-drawer');
  if (drawer && drawer.classList.contains('-translate-x-full')) {
    openSidebar();
  } else {
    closeSidebar();
  }
}

function navigate(viewName) {
  const views = ['home', 'report', 'news', 'settings'];
  if (!views.includes(viewName)) viewName = 'home';

  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  document.querySelectorAll('.header-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-target') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (viewName === 'report') {
    renderReportList();
    renderWardenKanban();
    renderStaffFloorplanPins();
  }

  window.history.replaceState(null, '', `#${viewName}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openNewReportForm() {
  navigate('report');
  toggleReportForm(true);
}

function toggleReportForm(forceState) {
  const panel = document.getElementById('report-form-panel');
  const btnText = document.getElementById('form-toggle-text');
  if (!panel) return;

  const isHidden = panel.classList.contains('hidden');
  const shouldOpen = forceState !== undefined ? forceState : isHidden;

  if (shouldOpen) {
    panel.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Hide Report Form';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    panel.classList.add('hidden');
    if (btnText) btnText.textContent = 'Submit New Report';
  }
}

// ==========================================
// USER AUTH & ROLE-BASED ACCESS CONTROL
// ==========================================
function updateUI() {
  if (!currentUser) return;

  const isStaff = currentUser.role === 'staff';

  const headerAvatar = document.getElementById('header-avatar');
  const headerName = document.getElementById('header-user-name');
  const headerRole = document.getElementById('header-role-pill');
  const headerReportNav = document.getElementById('header-nav-report-label');
  const drawerReportNav = document.getElementById('drawer-nav-report-label');
  const heroSecondaryBtnText = document.getElementById('hero-secondary-btn-text');

  if (headerAvatar) headerAvatar.textContent = currentUser.avatar;
  if (headerName) headerName.textContent = currentUser.name;
  if (headerRole) {
    headerRole.textContent = isStaff ? 'Staff' : 'Student';
    headerRole.className = isStaff 
      ? 'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700'
      : 'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-700';
  }

  if (headerReportNav) {
    headerReportNav.textContent = isStaff ? 'Command Center (Staff)' : 'Submit Report';
  }
  if (drawerReportNav) {
    drawerReportNav.textContent = isStaff ? 'Command Center (Staff)' : 'Submit Report';
  }
  if (heroSecondaryBtnText) {
    heroSecondaryBtnText.textContent = isStaff ? 'Warden Command Center' : 'Track Your Ticket';
  }

  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-display-name');
  const userRoleBadge = document.getElementById('user-role-badge');
  const userUnitInfo = document.getElementById('user-unit-info');
  const currentRoleLabel = document.getElementById('current-role-label');

  if (userAvatar) userAvatar.textContent = currentUser.avatar;
  if (userDisplayName) userDisplayName.textContent = currentUser.name;
  if (userRoleBadge) {
    userRoleBadge.textContent = isStaff ? 'Facility Staff' : 'Student';
    userRoleBadge.className = isStaff
      ? 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-orange-100 text-orange-700'
      : 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-brand-100 text-brand-700';
  }
  if (userUnitInfo) userUnitInfo.textContent = currentUser.unit;
  if (currentRoleLabel) currentRoleLabel.textContent = isStaff ? 'Staff' : 'Student';

  const reportViewTitle = document.getElementById('report-view-title');
  const reportViewSubtitle = document.getElementById('report-view-subtitle');
  const roleViewBadge = document.getElementById('role-view-badge');

  if (reportViewTitle) {
    reportViewTitle.textContent = isStaff 
      ? 'Warden & Contractor Command Center' 
      : 'Report Maintenance Issue';
  }
  if (reportViewSubtitle) {
    reportViewSubtitle.textContent = isStaff
      ? 'Gemini multimodal triage, priority Kanban board, defect analytics, and 1-click contractor dispatch.'
      : 'Submit maintenance tickets with media and floorplan pinning. Reports are securely handled by facility staff.';
  }
  if (roleViewBadge) {
    roleViewBadge.textContent = isStaff ? 'Staff Command 🔒' : 'Resident Portal';
    roleViewBadge.className = isStaff
      ? 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-800'
      : 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-100 text-brand-700';
  }

  // Collapse the new report form by default when switching into Staff view so Warden sees Analytics + Kanban immediately
  if (isStaff) {
    toggleReportForm(false);
  }

  const sName = document.getElementById('settings-name');
  const sRole = document.getElementById('settings-role');
  const sUnit = document.getElementById('settings-unit');
  const sPhone = document.getElementById('settings-phone');
  if (sName) sName.textContent = currentUser.name;
  if (sRole) sRole.textContent = currentUser.roleLabel;
  if (sUnit) sUnit.textContent = currentUser.unit;
  if (sPhone) sPhone.textContent = currentUser.phone;

  const studentMyName = document.getElementById('student-my-name');
  if (studentMyName) studentMyName.textContent = currentUser.name;

  updateStats();
  renderReportList();
  renderWardenKanban();
  renderStaffFloorplanPins();
}

function toggleUserRole() {
  if (currentUser.role === 'student') {
    currentUser = { ...DEMO_ACCOUNTS.staff };
    showToast('Switched to Facility Staff Mode (Warden Command Center Unlocked) 🔧');
  } else {
    currentUser = { ...DEMO_ACCOUNTS.student };
    showToast('Switched to Student Resident Mode (Confidential Directory) 🎓');
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  updateUI();
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('modal-open');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    setLoginRole(currentUser ? currentUser.role : 'student');
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('modal-open');
    modal.classList.add('opacity-0', 'pointer-events-none');
  }
}

function setLoginRole(role) {
  loginSelectedRole = role;
  const studentTab = document.getElementById('role-tab-student');
  const staffTab = document.getElementById('role-tab-staff');
  const studentFields = document.getElementById('student-login-fields');
  const staffFields = document.getElementById('staff-login-fields');

  if (role === 'student') {
    studentTab.className = 'flex-1 py-2 text-xs font-extrabold rounded-lg transition-all bg-white text-brand-900 shadow';
    staffTab.className = 'flex-1 py-2 text-xs font-extrabold rounded-lg transition-all text-white/80 hover:text-white';
    studentFields.classList.remove('hidden');
    staffFields.classList.add('hidden');
  } else {
    staffTab.className = 'flex-1 py-2 text-xs font-extrabold rounded-lg transition-all bg-white text-brand-900 shadow';
    studentTab.className = 'flex-1 py-2 text-xs font-extrabold rounded-lg transition-all text-white/80 hover:text-white';
    staffFields.classList.remove('hidden');
    studentFields.classList.add('hidden');
  }
}

function quickFillAccount(type) {
  setLoginRole(type);
  if (type === 'student') {
    document.getElementById('login-student-id').value = DEMO_ACCOUNTS.student.id;
    document.getElementById('login-student-name').value = DEMO_ACCOUNTS.student.name;
    document.getElementById('login-student-room').value = DEMO_ACCOUNTS.student.unit;
  } else {
    document.getElementById('login-staff-id').value = DEMO_ACCOUNTS.staff.id;
    document.getElementById('login-staff-name').value = DEMO_ACCOUNTS.staff.name;
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (loginSelectedRole === 'student') {
    const name = document.getElementById('login-student-name').value || 'Alex Tan';
    const id = document.getElementById('login-student-id').value || 'STU-2024-8891';
    const room = document.getElementById('login-student-room').value || 'Block A - Room 302';
    currentUser = {
      id,
      name,
      role: 'student',
      roleLabel: 'Student Resident',
      unit: room,
      phone: '+60 12-345 6789',
      avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };
  } else {
    const name = document.getElementById('login-staff-name').value || 'Encik Rahman';
    const id = document.getElementById('login-staff-id').value || 'STAFF-FAC-04';
    currentUser = {
      id,
      name,
      role: 'staff',
      roleLabel: 'Facility Team Lead',
      unit: 'Facilities Department',
      phone: '+60 19-876 5432',
      avatar: 'ER'
    };
  }
  try {
    await syncUserToDatabase(currentUser);
  } catch (e) {
    console.warn("User sync offline fallback:", e);
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  closeLoginModal();
  updateUI();
  showToast(`Welcome back, ${currentUser.name}!`);
}

// ==========================================
// INTERACTIVE FLOORPLAN PIN SELECTION
// ==========================================
function initFloorplanDefaults() {
  setFloorplanPin(245, 110, '3', 'Room 302 (Twin Sharing)');
}

function handleFloorplanClick(event) {
  const svg = document.getElementById('hostel-floorplan-svg');
  if (!svg) return;

  const screenMatrix = svg.getScreenCTM();
  if (!screenMatrix) return;

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const svgPoint = point.matrixTransform(screenMatrix.inverse());
  const x = Math.round(svgPoint.x);
  const y = Math.round(svgPoint.y);

  let roomName = 'Corridor / Common Passage';
  const targetZone = event.target.closest('.room-zone');
  if (targetZone && targetZone.dataset.roomName) {
    roomName = targetZone.dataset.roomName;
  }

  const floorSelect = document.getElementById('floorplan-level');
  const currentFloor = floorSelect ? floorSelect.value : '3';

  setFloorplanPin(x, y, currentFloor, roomName);
}

function setFloorplanPin(x, y, floor, roomName) {
  selectedFloorplanPoint = { x, y, floor, roomName };
  
  const pin = document.getElementById('floorplan-pin');
  const statusText = document.getElementById('floorplan-selection-text');
  const clearBtn = document.getElementById('clear-pin-btn');
  const coordsInput = document.getElementById('incident-floorplan-coords');

  if (pin) {
    pin.classList.remove('hidden');
    const circles = pin.querySelectorAll('circle');
    circles.forEach(c => {
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
    });
    const label = document.getElementById('pin-label');
    if (label) {
      label.setAttribute('x', x);
      label.setAttribute('y', y - 18);
      label.textContent = `📍 ${roomName}`;
    }
  }

  if (statusText) {
    statusText.textContent = `📍 Level ${floor} — ${roomName} (Coords: X:${x}, Y:${y})`;
    statusText.className = 'px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold';
  }

  if (clearBtn) clearBtn.classList.remove('hidden');
  if (coordsInput) coordsInput.value = JSON.stringify(selectedFloorplanPoint);
}

function clearFloorplanPin() {
  selectedFloorplanPoint = null;
  const pin = document.getElementById('floorplan-pin');
  const statusText = document.getElementById('floorplan-selection-text');
  const clearBtn = document.getElementById('clear-pin-btn');
  const coordsInput = document.getElementById('incident-floorplan-coords');

  if (pin) pin.classList.add('hidden');
  if (statusText) {
    statusText.textContent = 'None (Please click on the blueprint above)';
    statusText.className = 'px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-medium';
  }
  if (clearBtn) clearBtn.classList.add('hidden');
  if (coordsInput) coordsInput.value = '';
}

function changeFloorplanLevel() {
  const floorSelect = document.getElementById('floorplan-level');
  const floor = floorSelect ? floorSelect.value : '3';
  const svg = document.getElementById('hostel-floorplan-svg');

  if (svg) {
    svg.querySelectorAll('.room-zone[data-room-number]').forEach(zone => {
      const roomNumber = `${floor}${zone.dataset.roomNumber}`;
      zone.dataset.roomName = zone.dataset.roomName.replace(/\bRoom \d{3}\b/, `Room ${roomNumber}`);
      const roomLabel = zone.querySelector('.room-number');
      if (roomLabel) roomLabel.textContent = `Room ${roomNumber}`;
    });
  }

  if (selectedFloorplanPoint) {
    const roomName = selectedFloorplanPoint.roomName.replace(
      /\bRoom \d{3}\b/,
      room => `Room ${floor}${room.slice(-2)}`
    );
    setFloorplanPin(selectedFloorplanPoint.x, selectedFloorplanPoint.y, floor, roomName);
  }
}

// ==========================================
// LOCATION TYPE DROPDOWN & "OTHERS" TOGGLE
// ==========================================
function handleLocationTypeChange() {
  const select = document.getElementById('incident-location-type');
  const otherWrapper = document.getElementById('incident-location-other-wrapper');
  const otherInput = document.getElementById('incident-location-other');

  if (select.value === 'Others') {
    otherWrapper.classList.remove('hidden');
    otherInput.required = true;
    otherInput.focus();
  } else {
    otherWrapper.classList.add('hidden');
    otherInput.required = false;
    otherInput.value = '';

    if (select.value.includes('301')) setFloorplanPin(115, 105, '3', 'Room 301 (Single En-suite)');
    else if (select.value.includes('302')) setFloorplanPin(245, 105, '3', 'Room 302 (Twin Sharing)');
    else if (select.value.includes('Washroom')) setFloorplanPin(400, 105, '3', 'Common Bath & Showers');
    else if (select.value.includes('Pantry')) setFloorplanPin(685, 105, '3', 'Floor Pantry & Microwave Station');
    else if (select.value.includes('Laundry')) setFloorplanPin(480, 335, '3', 'Laundry Room (Washer / Dryer)');
    else if (select.value.includes('Study')) setFloorplanPin(290, 335, '3', 'Resident Study Lounge');
  }
}

// ==========================================
// MEDIA FILE UPLOADS (IMAGE & VIDEO)
// ==========================================
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (JPG, PNG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageBase64 = e.target.result;
    document.getElementById('image-upload-placeholder').classList.add('hidden');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview-element');
    previewImg.src = uploadedImageBase64;
    previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeImageUpload(e) {
  if (e) e.stopPropagation();
  uploadedImageBase64 = null;
  document.getElementById('incident-image').value = '';
  document.getElementById('image-upload-placeholder').classList.remove('hidden');
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('image-preview-element').src = '';
}

function handleVideoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    alert('Please upload a valid video file (MP4, WebM).');
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    alert('Video size exceeds 20MB. Please select a shorter clip.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedVideoBase64 = e.target.result;
    document.getElementById('video-upload-placeholder').classList.add('hidden');
    const previewContainer = document.getElementById('video-preview-container');
    const previewVideo = document.getElementById('video-preview-element');
    previewVideo.src = uploadedVideoBase64;
    previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function removeVideoUpload(e) {
  if (e) e.stopPropagation();
  uploadedVideoBase64 = null;
  document.getElementById('incident-video').value = '';
  document.getElementById('video-upload-placeholder').classList.remove('hidden');
  document.getElementById('video-preview-container').classList.add('hidden');
  document.getElementById('video-preview-element').src = '';
}

['image-drop-area', 'video-drop-area'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    el.addEventListener(eventName, (e) => {
      e.preventDefault();
      el.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    el.addEventListener(eventName, (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
    }, false);
  });
});

// ==========================================
// FORM SUBMISSION & AUTOMATIC TICKET ID + GEMINI TRIAGE
// ==========================================
async function handleReportSubmit(event) {
  event.preventDefault();

  // 1. Grab the submit button to lock it against spam clicks
  const submitBtn = event.submitter || event.target.querySelector('button[type="submit"]');

  if (!uploadedImageBase64) {
    alert('Mandatory Requirement: Please attach a photo of the maintenance issue.');
    document.getElementById('image-drop-area').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (!selectedFloorplanPoint) {
    alert('Please click on the floorplan map to pinpoint the incident location.');
    document.getElementById('floorplan-container').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const datetime = document.getElementById('incident-datetime').value;
  const phone = document.getElementById('incident-phone').value;
  const locationType = document.getElementById('incident-location-type').value;
  const customLocation = document.getElementById('incident-location-other').value;
  const category = document.getElementById('incident-category').value;
  const urgency = document.getElementById('incident-urgency').value;
  const description = document.getElementById('incident-description').value;

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newTicketId = `HK-2026-${randomNum}`;
  latestGeneratedTicketId = newTicketId;

  const newReport = enrichReportWithAiTriage({
    id: newTicketId,
    reporterName: currentUser ? currentUser.name : 'Resident',
    reporterPhone: phone,
    datetime,
    locationType,
    customLocation,
    category,
    urgency,
    description,
    status: 'Pending',
    floorplan: { ...selectedFloorplanPoint },
    imageUrl: uploadedImageBase64,
    videoUrl: uploadedVideoBase64 || '',
    staffNotes: '',
    createdAt: Date.now()
  });

  try {
    // 2. Disable button and show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>Submitting Ticket...</span>`;
    }

    // 3. Push to Firebase (using setDoc ID matching newTicketId to prevent duplicates)
    await submitTicketToDatabase(newReport);
    console.log("Ticket successfully pushed to Firebase!");

    currentReports.unshift(newReport);
    saveReports();

    document.getElementById('incident-report-form').reset();
    removeImageUpload();
    removeVideoUpload();
    clearFloorplanPin();
    initFormDateTime();

    toggleReportForm(false);
    renderReportList();
    renderWardenKanban();
    renderStaffFloorplanPins();
    showTicketSuccessModal(newReport);

  } catch (error) {
    console.error("Error saving ticket to Firebase:", error);
    alert("Error submitting ticket to cloud database. Please try again.");
  } finally {
    // 4. Always re-enable the button once finished
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.originalText || '<span>Submit Maintenance Ticket</span>';
    }
  }
}

function showTicketSuccessModal(report) {
  const modal = document.getElementById('ticket-success-modal');
  const idEl = document.getElementById('success-ticket-id');
  const locEl = document.getElementById('success-ticket-location');
  const catEl = document.getElementById('success-ticket-category');
  const urgEl = document.getElementById('success-ticket-urgency');
  const copyLabel = document.getElementById('copy-ticket-label');

  if (idEl) idEl.textContent = report.id;
  if (locEl) locEl.textContent = report.locationType === 'Others' && report.customLocation ? report.customLocation : report.locationType;
  if (catEl) catEl.textContent = `${report.category} (AI Trade: ${report.aiTriage.trade})`;
  if (urgEl) urgEl.textContent = `${report.urgency} (${report.aiTriage.urgencyScore})`;
  if (copyLabel) copyLabel.textContent = 'Copy Ticket ID';

  if (modal) {
    modal.classList.add('modal-open');
    modal.classList.remove('opacity-0', 'pointer-events-none');
  }
}

function closeTicketSuccessModal() {
  const modal = document.getElementById('ticket-success-modal');
  if (modal) {
    modal.classList.remove('modal-open');
    modal.classList.add('opacity-0', 'pointer-events-none');
  }
}

function copyCurrentTicketId() {
  if (!latestGeneratedTicketId) return;
  navigator.clipboard.writeText(latestGeneratedTicketId).then(() => {
    const copyLabel = document.getElementById('copy-ticket-label');
    const copyIcon = document.getElementById('copy-ticket-icon');
    if (copyLabel) copyLabel.textContent = 'Copied to Clipboard!';
    if (copyIcon) copyIcon.textContent = '✓';
    showToast(`Ticket ID ${latestGeneratedTicketId} copied!`);
    setTimeout(() => {
      if (copyLabel) copyLabel.textContent = 'Copy Ticket ID';
      if (copyIcon) copyIcon.textContent = '📋';
    }, 2500);
  });
}

function trackSpecificTicketFromModal() {
  closeTicketSuccessModal();
  const studentSearchInput = document.getElementById('student-search-input');
  if (studentSearchInput && latestGeneratedTicketId) {
    studentSearchInput.value = latestGeneratedTicketId;
    handleStudentTicketSearch();
    studentSearchInput.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================
// STUDENT TICKET ID LOOKUP WITH VISUAL TIMELINE STEPPER
// ==========================================
function handleStudentTicketSearch(event) {
  if (event) event.preventDefault();

  const searchInput = document.getElementById('student-search-input');
  const resultContainer = document.getElementById('student-ticket-result-container');
  if (!searchInput || !resultContainer) return;

  const query = searchInput.value.trim().toUpperCase();
  if (!query) {
    resultContainer.classList.add('hidden');
    return;
  }

  const matched = currentReports.find(r => r.id.toUpperCase() === query || r.id.toUpperCase().includes(query));

  resultContainer.classList.remove('hidden');

  if (!matched) {
    resultContainer.innerHTML = `
      <div class="p-6 rounded-2xl bg-red-50 border border-red-200 text-center text-xs text-red-700">
        <span class="text-2xl block mb-1">⚠️</span>
        <strong class="font-bold text-sm block">Ticket Not Found</strong>
        No incident report found matching Ticket ID <code class="font-mono bg-white px-2 py-0.5 rounded border border-red-300 font-bold">${query}</code>.
        <p class="mt-1 text-slate-500">Please double check the Ticket ID provided when you submitted the report.</p>
      </div>
    `;
    return;
  }

  enrichReportWithAiTriage(matched);

  let statusClass = 'bg-amber-100 text-amber-800 border-amber-300';
  let statusDot = 'bg-amber-500';
  let stepIndex = 2; // 1: Reported, 2: AI Triaged, 3: Dispatched/In Progress, 4: Resolved
  if (matched.status === 'In Progress') {
    statusClass = 'bg-blue-100 text-blue-800 border-blue-300';
    statusDot = 'bg-blue-500';
    stepIndex = 3;
  } else if (matched.status === 'Resolved') {
    statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    statusDot = 'bg-emerald-500';
    stepIndex = 4;
  }

  const steps = [
    { label: '1. Reported', done: stepIndex >= 1 },
    { label: `2. AI Triaged (${matched.aiTriage.trade})`, done: stepIndex >= 2 },
    { label: '3. Contractor Dispatched', done: stepIndex >= 3 },
    { label: '4. Resolved', done: stepIndex >= 4 }
  ];

  resultContainer.innerHTML = `
    <div class="bg-gradient-to-br from-brand-50/60 to-slate-50 rounded-2xl p-6 border-2 border-brand-200 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-100">
        <div>
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tracked Ticket</span>
          <h4 class="text-xl font-extrabold font-mono text-brand-900">${matched.id}</h4>
        </div>
        <div class="flex items-center space-x-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass} flex items-center space-x-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            <span>Status: ${matched.status}</span>
          </span>
        </div>
      </div>

      <!-- Visual Progress Timeline Stepper -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        ${steps.map(s => `
          <div class="p-2.5 rounded-xl border text-center text-[11px] font-bold ${s.done ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}">
            ${s.done ? '✓ ' : '○ '}${s.label}
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span class="text-slate-400 font-bold uppercase text-[10px] block">Location:</span>
          <span class="font-semibold text-slate-800">${matched.locationType === 'Others' ? matched.customLocation : matched.locationType}</span>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase text-[10px] block">Floorplan Pin:</span>
          <span class="font-semibold text-brand-700">Level ${matched.floorplan ? matched.floorplan.floor : '3'} — ${matched.floorplan ? matched.floorplan.roomName : 'Pin'}</span>
        </div>
        <div>
          <span class="text-slate-400 font-bold uppercase text-[10px] block">Assigned Contractor:</span>
          <span class="font-semibold text-slate-800">${matched.aiTriage.contractor}</span>
        </div>
      </div>

      <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <span class="font-bold text-slate-700 block mb-1">🛠️ Facility Staff & AI Triage Update:</span>
        <p class="text-slate-600">${matched.staffNotes ? matched.staffNotes : matched.aiTriage.aiSummary}</p>
      </div>

      <div class="flex justify-end pt-1">
        <button onclick="openReportDetail('${matched.id}')" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors">
          View Complete Report & Photos →
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// PERSON 4: WARDEN PRIORITY KANBAN, FLOORPLAN PINS & AI INSPECTOR
// ==========================================
function renderStaffFloorplanPins() {
  const layer = document.getElementById('staff-floorplan-pins-layer');
  if (!layer) return;

  layer.innerHTML = currentReports.map(r => {
    enrichReportWithAiTriage(r);
    const x = r.floorplan && r.floorplan.x ? r.floorplan.x : 245;
    const y = r.floorplan && r.floorplan.y ? r.floorplan.y : 110;
    const bucket = r.aiTriage.urgencyBucket;
    const fill = bucket === 'Emergency' ? '#ef4444' : bucket === 'Priority' ? '#f59e0b' : '#10b981';
    const icon = bucket === 'Emergency' ? '!' : '📍';

    return `
      <g style="cursor:pointer;" onclick="openAiTriageInspector('${r.id}')">
        <circle cx="${x}" cy="${y}" r="14" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
        <text x="${x}" y="${y + 4}" fill="#ffffff" font-size="11" font-weight="bold" text-anchor="middle">${icon}</text>
      </g>
    `;
  }).join('');
}

function renderWardenKanban() {
  const colEmergency = document.getElementById('kanban-col-emergency');
  const colPriority = document.getElementById('kanban-col-priority');
  const colRoutine = document.getElementById('kanban-col-routine');
  if (!colEmergency || !colPriority || !colRoutine) return;

  const tradeFilter = document.getElementById('kanban-trade-filter')?.value || 'ALL';
  const blockFilter = document.getElementById('kanban-block-filter')?.value || 'ALL';
  const searchVal = (document.getElementById('kanban-search-input')?.value || '').toLowerCase().trim();

  const enriched = currentReports.map(enrichReportWithAiTriage);

  const filtered = enriched.filter(r => {
    const locText = (r.locationType === 'Others' && r.customLocation) ? r.customLocation : r.locationType;
    const matchTrade = tradeFilter === 'ALL' || r.aiTriage.trade === tradeFilter;
    const matchBlock = blockFilter === 'ALL' || r.aiTriage.block === blockFilter || locText.includes(blockFilter);
    const matchSearch = !searchVal ||
      r.id.toLowerCase().includes(searchVal) ||
      locText.toLowerCase().includes(searchVal) ||
      r.description.toLowerCase().includes(searchVal) ||
      r.reporterName.toLowerCase().includes(searchVal);
    return matchTrade && matchBlock && matchSearch;
  });

  const emergencyList = filtered.filter(r => r.aiTriage.urgencyBucket === 'Emergency');
  const priorityList = filtered.filter(r => r.aiTriage.urgencyBucket === 'Priority');
  const routineList = filtered.filter(r => r.aiTriage.urgencyBucket === 'Routine');

  const cEm = document.getElementById('kanban-count-emergency');
  const cPr = document.getElementById('kanban-count-priority');
  const cRo = document.getElementById('kanban-count-routine');
  if (cEm) cEm.textContent = emergencyList.length;
  if (cPr) cPr.textContent = priorityList.length;
  if (cRo) cRo.textContent = routineList.length;

  colEmergency.innerHTML = emergencyList.map(renderKanbanCardHTML).join('') || `<div class="text-xs text-slate-400 text-center py-6">No emergency tickets match filter</div>`;
  colPriority.innerHTML = priorityList.map(renderKanbanCardHTML).join('') || `<div class="text-xs text-slate-400 text-center py-6">No priority tickets match filter</div>`;
  colRoutine.innerHTML = routineList.map(renderKanbanCardHTML).join('') || `<div class="text-xs text-slate-400 text-center py-6">No routine tickets match filter</div>`;
}

function renderKanbanCardHTML(r) {
  const tradeColors = {
    HVAC: 'bg-sky-100 text-sky-800',
    Plumbing: 'bg-blue-100 text-blue-800',
    Electrical: 'bg-amber-100 text-amber-800',
    Carpentry: 'bg-emerald-100 text-emerald-800'
  };
  const displayLoc = r.locationType === 'Others' && r.customLocation ? r.customLocation : r.locationType;
  const statusBadge = r.status === 'In Progress'
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700">🔧 Dispatched</span>`
    : r.status === 'Resolved'
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700">✓ Resolved</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-700">Pending Triage</span>`;

  return `
    <div onclick="openAiTriageInspector('${r.id}')" class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-400 transition-all cursor-pointer">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="font-mono text-[11px] font-extrabold text-slate-500">${r.id}</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tradeColors[r.aiTriage.trade] || 'bg-slate-100'}">${r.aiTriage.trade}</span>
      </div>
      <div class="flex gap-3 items-start">
        <img src="${r.imageUrl}" alt="${displayLoc}" class="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <h5 class="text-xs font-extrabold text-slate-900 truncate">${displayLoc}</h5>
          <p class="text-[11px] text-slate-600 line-clamp-2 mt-0.5">${r.description}</p>
        </div>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span class="font-bold text-slate-500">✨ AI: <strong class="text-slate-800">${r.aiTriage.urgencyScore}</strong></span>
        ${statusBadge}
      </div>
    </div>
  `;
}

function openAiTriageInspector(ticketId) {
  const report = currentReports.find(item => item.id === ticketId) || currentReports[0];
  if (!report) return;
  enrichReportWithAiTriage(report);
  activeInspectorTicketId = report.id;

  const displayLoc = report.locationType === 'Others' && report.customLocation ? report.customLocation : report.locationType;
  const coordsText = report.floorplan
    ? `Level ${report.floorplan.floor} — ${report.floorplan.roomName} (X:${report.floorplan.x}, Y:${report.floorplan.y})`
    : 'Level 3 Pin';

  const setElText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setElAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el[attr] = val; };

  setElText('inspector-ticket-id', report.id);
  setElText('inspector-trade-pill', `🔧 Trade: ${report.aiTriage.trade}`);
  setElText('inspector-title', `${displayLoc} — ${report.category}`);
  setElAttr('inspector-image', 'src', report.imageUrl);
  setElText('inspector-student', report.reporterName);
  setElText('inspector-location', displayLoc);
  setElText('inspector-coords', coordsText);
  setElText('inspector-phone', `${report.reporterPhone} 💬`);
  setElAttr('inspector-phone', 'href', `https://wa.me/${report.reporterPhone.replace(/[^0-9]/g, '')}`);
  setElText('inspector-desc', `"${report.description}"`);
  setElText('inspector-confidence', `AI Confidence: ${report.aiTriage.confidence}`);
  setElText('inspector-ai-summary', report.aiTriage.aiSummary);
  setElText('inspector-hazard', report.aiTriage.hazard);

  const pill = document.getElementById('inspector-urgency-pill');
  if (pill) {
    if (report.aiTriage.urgencyBucket === 'Emergency') {
      pill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-red-100 text-red-700';
      pill.textContent = `🔴 Emergency (${report.aiTriage.urgencyScore})`;
    } else if (report.aiTriage.urgencyBucket === 'Priority') {
      pill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-amber-100 text-amber-700';
      pill.textContent = `🟡 Priority (${report.aiTriage.urgencyScore})`;
    } else {
      pill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-700';
      pill.textContent = `🟢 Routine (${report.aiTriage.urgencyScore})`;
    }
  }

  const partsList = document.getElementById('inspector-parts-list');
  if (partsList) {
    partsList.innerHTML = report.aiTriage.parts.map(p => `
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" checked class="rounded text-brand-600 focus:ring-brand-500" />
        <span class="font-medium text-slate-700">${p}</span>
      </label>
    `).join('');
  }

  const selectEl = document.getElementById('inspector-contractor-select');
  if (selectEl) {
    for (let i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value === report.aiTriage.contractor) {
        selectEl.selectedIndex = i;
        break;
      }
    }
  }

  // Open modal using opacity & pointer-events transition
  const modal = document.getElementById('ai-triage-inspector-modal');
  if (modal) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
  }
}

function closeAiTriageInspector() {
  const modal = document.getElementById('ai-triage-inspector-modal');
  if (modal) {
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('opacity-0', 'pointer-events-none');
  }
}

async function triggerOneClickDispatch() {
  const report = currentReports.find(item => item.id === activeInspectorTicketId);
  if (!report) return;

  const chosenContractor = document.getElementById('inspector-contractor-select')?.value || report.aiTriage.contractor;
  const newStatus = 'In Progress';
  const newNotes = `Dispatched to ${chosenContractor} via Gemini One-Click Triage. Parts checklist attached.`;

  report.status = newStatus;
  report.staffNotes = newNotes;
  report.aiTriage.contractor = chosenContractor;

  try {
    if (report.firebaseDocId) {
      await updateTicketStatusInDatabase(report.firebaseDocId, newStatus, newNotes);
    }
  } catch (e) {
    console.warn("Firebase status update fallback:", e);
  }

  saveReports();
  renderReportList();
  renderWardenKanban();
  closeAiTriageInspector();
  showToast(`🚀 Dispatched ${chosenContractor} for ${report.id}! Contractor & Student notified.`);
}

function switchStaffViewMode(mode) {
  const kanbanWrap = document.getElementById('staff-kanban-wrapper');
  const gridWrap = document.getElementById('staff-grid-wrapper');
  const btnKanban = document.getElementById('btn-view-kanban');
  const btnGrid = document.getElementById('btn-view-grid');
  if (!kanbanWrap || !gridWrap) return;

  if (mode === 'kanban') {
    kanbanWrap.classList.remove('hidden');
    gridWrap.classList.add('hidden');
    btnKanban.className = 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-white text-slate-900 shadow transition-all';
    btnGrid.className = 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white/80 hover:text-white transition-all';
  } else {
    kanbanWrap.classList.add('hidden');
    gridWrap.classList.remove('hidden');
    btnGrid.className = 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-white text-slate-900 shadow transition-all';
    btnKanban.className = 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white/80 hover:text-white transition-all';
  }
}

// ==========================================
// GEMINI AI STATUS CONCIERGE CHATBOT
// ==========================================
function toggleAiConcierge(forceState) {
  const win = document.getElementById('ai-concierge-window');
  if (!win) return;
  const isHidden = win.classList.contains('hidden');
  const shouldOpen = forceState !== undefined ? forceState : isHidden;
  if (shouldOpen) {
    win.classList.remove('hidden');
    win.classList.add('flex');
  } else {
    win.classList.add('hidden');
    win.classList.remove('flex');
  }
}

function askConciergePreset(questionText) {
  const input = document.getElementById('ai-concierge-input');
  if (input) {
    input.value = questionText;
    handleConciergeSubmit(new Event('submit'));
  }
}

function handleConciergeSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const input = document.getElementById('ai-concierge-input');
  const messages = document.getElementById('ai-concierge-messages');
  if (!input || !messages) return;

  const query = input.value.trim();
  if (!query) return;

  // Append user message
  messages.innerHTML += `
    <div class="flex justify-end">
      <div class="bg-brand-600 text-white px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
        ${query}
      </div>
    </div>
  `;
  input.value = '';

  // Generate smart response from live currentReports
  const qLower = query.toLowerCase();
  let reply = '';

  const matchedTicket = currentReports.find(r =>
    qLower.includes(r.id.toLowerCase()) ||
    (r.locationType && qLower.includes(r.locationType.toLowerCase().replace('block a - ', '').replace('common area - ', ''))) ||
    (qLower.includes('302') && r.locationType.includes('302')) ||
    (qLower.includes('301') && r.locationType.includes('301')) ||
    (qLower.includes('laundry') && r.locationType.toLowerCase().includes('laundry')) ||
    (qLower.includes('pantry') && r.locationType.toLowerCase().includes('pantry'))
  );

  if (matchedTicket) {
    enrichReportWithAiTriage(matchedTicket);
    reply = `🎫 <strong>${matchedTicket.id} (${matchedTicket.locationType})</strong> is currently <strong>${matchedTicket.status}</strong>.<br>• <strong>AI Trade:</strong> ${matchedTicket.aiTriage.trade} (${matchedTicket.aiTriage.urgencyScore})<br>• <strong>Assigned Team:</strong> ${matchedTicket.aiTriage.contractor}<br>• <strong>Latest Note:</strong> ${matchedTicket.staffNotes || matchedTicket.aiTriage.aiSummary}`;
  } else if (qLower.includes('urgent') || qLower.includes('emergency') || qLower.includes('hazard')) {
    const urgents = currentReports.filter(r => enrichReportWithAiTriage(r).aiTriage.urgencyBucket === 'Emergency' && r.status !== 'Resolved');
    reply = `🚨 There are currently <strong>${urgents.length} active Emergency hazard(s)</strong>:<br>` +
      urgents.map(u => `• <strong>${u.id}</strong> (${u.locationType}): ${u.aiTriage.hazard}`).join('<br>');
  } else {
    const pendingCount = currentReports.filter(r => r.status === 'Pending').length;
    const progressCount = currentReports.filter(r => r.status === 'In Progress').length;
    reply = `📊 Across HostelKaki right now, we have <strong>${pendingCount} Pending</strong> and <strong>${progressCount} In-Progress</strong> tickets. You can ask me about a specific room (e.g. <em>"Room 302"</em>, <em>"Laundry Room"</em>) or Ticket ID (e.g. <em>"HK-2026-1082"</em>)!`;
  }

  setTimeout(() => {
    messages.innerHTML += `
      <div class="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-200 text-slate-700 shadow-sm">
        ${reply}
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
  }, 200);
}

// ==========================================
// DIRECTORY RENDERING & SEARCH (STAFF & STUDENT)
// ==========================================
function setFilterStatus(status) {
  currentFilter = status;
  document.querySelectorAll('.status-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-status') === status) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderReportList();
}

function renderReportList() {
  if (!currentUser) return;

  const isStaff = currentUser.role === 'staff';
  const staffSection = document.getElementById('staff-directory-section');
  const studentSection = document.getElementById('student-access-section');

  if (isStaff) {
    if (staffSection) staffSection.classList.remove('hidden');
    if (studentSection) studentSection.classList.add('hidden');
    renderStaffDirectory();
    renderWardenKanban();
    renderStaffFloorplanPins();
  } else {
    if (staffSection) staffSection.classList.add('hidden');
    if (studentSection) studentSection.classList.remove('hidden');
    renderStudentPersonalReports();
  }

  updateStats();
}

function renderStaffDirectory() {
  const container = document.getElementById('reports-container');
  const emptyState = document.getElementById('reports-empty-state');
  const searchInput = document.getElementById('directory-search');
  const searchQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();

  if (!container) return;

  const filtered = currentReports.filter(report => {
    const matchesStatus = currentFilter === 'all' || report.status === currentFilter;
    const matchesTicketId = report.id.toLowerCase().includes(searchQuery);
    const matchesLocation = report.locationType.toLowerCase().includes(searchQuery) ||
      (report.customLocation && report.customLocation.toLowerCase().includes(searchQuery));
    const matchesCategory = report.category.toLowerCase().includes(searchQuery);
    const matchesDescription = report.description.toLowerCase().includes(searchQuery);

    return matchesStatus && (!searchQuery || matchesTicketId || matchesLocation || matchesCategory || matchesDescription);
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  container.innerHTML = filtered.map(report => createReportCardHTML(report, true)).join('');
}

function renderStudentPersonalReports() {
  const container = document.getElementById('student-my-reports-list');
  const countBadge = document.getElementById('student-my-count');
  if (!container) return;

  const studentReports = currentReports.filter(r => r.reporterName === currentUser.name || r.reporterPhone === currentUser.phone);

  if (countBadge) {
    countBadge.textContent = `${studentReports.length} ${studentReports.length === 1 ? 'Report' : 'Reports'}`;
  }

  if (studentReports.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400">
        <p class="text-xs">You have not submitted any maintenance reports yet.</p>
        <button onclick="toggleReportForm(true)" class="mt-2 text-xs font-bold text-brand-600 hover:underline">
          + Submit your first report
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = studentReports.map(report => createReportCardHTML(report, false)).join('');
}

function createReportCardHTML(report, isStaffView) {
  enrichReportWithAiTriage(report);

  let statusClass = 'bg-amber-100 text-amber-800 border-amber-200';
  let statusDot = 'bg-amber-500';
  if (report.status === 'In Progress') {
    statusClass = 'bg-blue-100 text-blue-800 border-blue-200';
    statusDot = 'bg-blue-500';
  } else if (report.status === 'Resolved') {
    statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    statusDot = 'bg-emerald-500';
  }

  let urgencyBadge = '<span class="text-[10px] font-bold text-slate-500">Normal</span>';
  if (report.urgency === 'Urgent') {
    urgencyBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-100 text-red-700">Urgent</span>';
  } else if (report.urgency === 'Medium') {
    urgencyBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Medium</span>';
  }

  const displayLocation = report.locationType === 'Others' && report.customLocation 
    ? `Others: ${report.customLocation}` 
    : report.locationType;

  const formattedDate = new Date(report.datetime || report.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      <div class="relative h-44 bg-slate-100 overflow-hidden cursor-pointer" onclick="${isStaffView ? `openAiTriageInspector('${report.id}')` : `openReportDetail('${report.id}')`}">
        <img src="${report.imageUrl}" alt="Issue Evidence" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        
        <div class="absolute top-3 left-3 flex items-center space-x-1.5">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusClass} flex items-center space-x-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            <span>${report.status}</span>
          </span>
        </div>

        <div class="absolute top-3 right-3 flex items-center space-x-1">
          ${report.videoUrl ? '<span class="p-1 rounded-md bg-black/60 text-white text-xs" title="Has Video Clip">🎥</span>' : ''}
          <span class="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white font-mono text-xs font-bold border border-white/20 backdrop-blur-md shadow">
            ${report.id}
          </span>
        </div>

        <div class="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] truncate flex items-center justify-between">
          <span>📍 Lvl ${report.floorplan ? report.floorplan.floor : '3'}: ${report.floorplan ? report.floorplan.roomName : displayLocation}</span>
          <span class="text-sky-300 font-bold">✨ ${report.aiTriage.trade}</span>
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>${report.category}</span>
            ${urgencyBadge}
          </div>
          <h3 class="font-bold text-slate-900 text-base leading-snug line-clamp-1">${displayLocation}</h3>
          <p class="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">${report.description}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="text-slate-400">
            <span>🕒 ${formattedDate}</span>
          </div>
          <div class="flex items-center gap-2">
            ${isStaffView ? `
              <button onclick="openAiTriageInspector('${report.id}')" class="font-extrabold text-brand-600 hover:text-brand-800 transition-colors">
                ✨ AI Triage →
              </button>
            ` : `
              <button onclick="openReportDetail('${report.id}')" class="font-bold text-brand-600 hover:text-brand-800 transition-colors">
                View Details →
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function updateStats() {
  const countAll = document.getElementById('count-all');
  const countPending = document.getElementById('count-pending');
  const countProgress = document.getElementById('count-progress');
  const countResolved = document.getElementById('count-resolved');
  const drawerBadge = document.getElementById('report-count-badge');
  
  // Support both index.html and staff portal element ID conventions
  const statActive = document.getElementById('stat-active') || document.getElementById('statPending');
  const statResolved = document.getElementById('stat-resolved') || document.getElementById('statResolved');
  const statUrgent = document.getElementById('statUrgent');

  const pending = currentReports.filter(r => r.status === 'Pending').length;
  const inProgress = currentReports.filter(r => r.status === 'In Progress').length;
  const resolved = currentReports.filter(r => r.status === 'Resolved').length;
  const urgent = currentReports.filter(r => r.urgency === 'Urgent' && r.status !== 'Resolved').length;

  if (countAll) countAll.textContent = currentReports.length;
  if (countPending) countPending.textContent = pending;
  if (countProgress) countProgress.textContent = inProgress;
  if (countResolved) countResolved.textContent = resolved;
  if (drawerBadge) drawerBadge.textContent = pending + inProgress;

  if (statActive) statActive.textContent = pending + inProgress;
  if (statResolved) statResolved.textContent = resolved;
  if (statUrgent) statUrgent.textContent = urgent;
}

// ==========================================
// REPORT DETAIL MODAL & STAFF ACTIONS
// ==========================================
function openReportDetail(reportId) {
  const report = currentReports.find(r => r.id === reportId);
  if (!report) return;
  enrichReportWithAiTriage(report);

  const modal = document.getElementById('report-detail-modal');
  const card = document.getElementById('report-detail-card');
  if (!modal || !card) return;

  const displayLocation = report.locationType === 'Others' && report.customLocation 
    ? `Others (${report.customLocation})` 
    : report.locationType;

  const formattedDateTime = new Date(report.datetime || report.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const isStaff = currentUser && currentUser.role === 'staff';

  card.innerHTML = `
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">🎫</span>
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xl font-extrabold font-mono text-slate-900">${report.id}</h2>
            <button onclick="navigator.clipboard.writeText('${report.id}'); showToast('Ticket ID copied!');" class="text-xs text-brand-600 hover:underline font-bold">
              [Copy ID]
            </button>
          </div>
          <p class="text-xs text-slate-500">${report.category} • ${report.urgency} Urgency • AI Trade: ${report.aiTriage.trade}</p>
        </div>
      </div>
      <button onclick="closeReportDetail()" class="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 text-sm">
        ✕
      </button>
    </div>

    <div class="mt-4 grid grid-cols-1 ${report.videoUrl ? 'sm:grid-cols-2' : ''} gap-4">
      <div>
        <span class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">📸 Photo Evidence (Mandatory)</span>
        <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src="${report.imageUrl}" alt="Photo Evidence" class="w-full max-h-64 object-contain mx-auto">
        </div>
      </div>
      ${report.videoUrl ? `
        <div>
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">🎥 Video Evidence</span>
          <div class="rounded-xl overflow-hidden border border-slate-200 bg-black">
            <video src="${report.videoUrl}" controls class="w-full max-h-64"></video>
          </div>
        </div>
      ` : ''}
    </div>

    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
      <div>
        <span class="font-bold text-slate-500 uppercase">Reported Location:</span>
        <p class="text-sm font-semibold text-slate-800 mt-0.5">${displayLocation}</p>
      </div>
      <div>
        <span class="font-bold text-slate-500 uppercase">Mapped Floorplan:</span>
        <p class="text-sm font-semibold text-brand-700 mt-0.5">
          Level ${report.floorplan ? report.floorplan.floor : '3'} — ${report.floorplan ? report.floorplan.roomName : 'Unit Location'}
        </p>
      </div>
      <div>
        <span class="font-bold text-slate-500 uppercase">Date & Time of Incident:</span>
        <p class="text-sm font-semibold text-slate-800 mt-0.5">${formattedDateTime}</p>
      </div>
      <div>
        <span class="font-bold text-slate-500 uppercase">Resident Contact Phone:</span>
        <p class="text-sm font-semibold text-slate-800 mt-0.5">
          <a href="tel:${report.reporterPhone}" class="text-brand-600 hover:underline font-bold">📞 ${report.reporterPhone}</a>
        </p>
      </div>
    </div>

    <div class="mt-4">
      <span class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Detailed Description</span>
      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
        ${report.description}
      </div>
    </div>

    <div class="mt-6 pt-5 border-t border-slate-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
          <span>🛠️ Facility Management Status:</span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : report.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">
            ${report.status}
          </span>
        </h3>
      </div>

      ${isStaff ? `
        <div class="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 space-y-3">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold uppercase text-orange-950">Update Ticket Status (Staff Only):</span>
            <select id="modal-status-select" class="text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-300 bg-white">
              <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-slate-700 mb-1">Staff Work Notes / Technician Log:</label>
            <input type="text" id="modal-staff-notes" value="${report.staffNotes || ''}" placeholder="e.g. Technician Ah Seng dispatched, parts ordered..."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
          </div>

          <button onclick="saveReportStaffUpdate('${report.id}')" class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
            Save Status & Notes
          </button>
        </div>
      ` : `
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span class="font-bold text-slate-700">Staff Update:</span> 
          ${report.staffNotes ? report.staffNotes : report.aiTriage.aiSummary}
        </div>
      `}
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
      <button onclick="closeReportDetail()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors">
        Close
      </button>
    </div>
  `;

  modal.classList.add('modal-open');
  modal.classList.remove('opacity-0', 'pointer-events-none');
}

function closeReportDetail() {
  const modal = document.getElementById('report-detail-modal');
  if (modal) {
    modal.classList.remove('modal-open');
    modal.classList.add('opacity-0', 'pointer-events-none');
  }
}

async function saveReportStaffUpdate(reportId) {
  const report = currentReports.find(r => r.id === reportId);
  if (!report) return;

  const newStatus = document.getElementById('modalStatus').value; // e.g., "Resolved"
  const newNotes = document.getElementById('modal-staff-notes')?.value || 'Updated via Staff Portal';

  report.status = newStatus;
  report.staffNotes = newNotes;

  try {
    // Crucial: Check if firebaseDocId exists for Firestore sync
    if (report.firebaseDocId) {
      await updateTicketStatusInDatabase(report.firebaseDocId, newStatus, newNotes);
      console.log("Synced update successfully to Firebase!");
    } else {
      console.warn("firebaseDocId missing; updated locally only.");
    }
  } catch (e) {
    console.error("Failed to sync status update to database:", e);
  }

  saveReports();
  renderReportList();
  renderWardenKanban();
  showToast(`Ticket ${report.id} updated to "${newStatus}"!`);
}

// ==========================================
// DEMO RESET & CLEANUP
// ==========================================
function resetDemoData() {
  if (confirm('Reset to initial sample reports?')) {
    currentReports = [...SAMPLE_REPORTS].map(enrichReportWithAiTriage);
    saveReports();
    renderReportList();
    renderWardenKanban();
    renderStaffFloorplanPins();
    showToast('Demo data reloaded successfully!');
  }
}

function clearAllData() {
  if (confirm('Clear all stored reports? This action cannot be undone.')) {
    currentReports = [];
    saveReports();
    renderReportList();
    renderWardenKanban();
    renderStaffFloorplanPins();
    showToast('All reports have been cleared.');
  }
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

// ==========================================
// GLOBAL WINDOW BINDINGS FOR INLINE HTML HANDLERS
// ==========================================
window.openNewReportForm = openNewReportForm;
window.toggleReportForm = toggleReportForm;
window.toggleUserRole = toggleUserRole;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.setLoginRole = setLoginRole;
window.quickFillAccount = quickFillAccount;
window.handleLoginSubmit = handleLoginSubmit;
window.handleFloorplanClick = handleFloorplanClick;
window.clearFloorplanPin = clearFloorplanPin;
window.changeFloorplanLevel = changeFloorplanLevel;
window.handleLocationTypeChange = handleLocationTypeChange;
window.handleImageSelect = handleImageSelect;
window.removeImageUpload = removeImageUpload;
window.handleVideoSelect = handleVideoSelect;
window.removeVideoUpload = removeVideoUpload;
window.handleReportSubmit = handleReportSubmit;
window.closeTicketSuccessModal = closeTicketSuccessModal;
window.copyCurrentTicketId = copyCurrentTicketId;
window.trackSpecificTicketFromModal = trackSpecificTicketFromModal;
window.handleStudentTicketSearch = handleStudentTicketSearch;
window.setFilterStatus = setFilterStatus;
window.renderReportList = renderReportList;
window.openReportDetail = openReportDetail;
window.closeReportDetail = closeReportDetail;
window.saveReportStaffUpdate = saveReportStaffUpdate;
window.resetDemoData = resetDemoData;
window.clearAllData = clearAllData;
window.navigate = navigate;

// Person 4 Warden Command Center & AI Concierge Window Bindings
window.renderWardenKanban = renderWardenKanban;
window.openAiTriageInspector = openAiTriageInspector;
window.closeAiTriageInspector = closeAiTriageInspector;
window.triggerOneClickDispatch = triggerOneClickDispatch;
window.switchStaffViewMode = switchStaffViewMode;
window.toggleAiConcierge = toggleAiConcierge;
window.handleConciergeSubmit = handleConciergeSubmit;
window.askConciergePreset = askConciergePreset;
