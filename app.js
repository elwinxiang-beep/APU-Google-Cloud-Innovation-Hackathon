initRealtimeTickets
handleLoginSubmit
handleReportSubmit
saveReportStaffUpdate

/**
 * HostelKaki - Residential Maintenance Issue Portal
 * Core Application Logic & State Management
 * Features: Role-Based Visibility (Staff vs Student) & Auto Ticket ID Generation
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
    category: 'Plumbing & Water',
    urgency: 'Medium',
    description: 'The basin tap in Room 302 has a persistent water leak at the base valve. Water drips onto the cabinet floor and creates puddles overnight.',
    status: 'In Progress',
    floorplan: {
      floor: '3',
      x: 245,
      y: 110,
      roomName: 'Room 302 (Twin Sharing)'
    },
    imageUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20fill%3D%22%23e0f2fe%22%20width%3D%22600%22%20height%3D%22400%22%2F%3E%3Cpath%20d%3D%22M250%20180%20Q300%20120%20350%20180%20L350%20260%20L250%20260%20Z%22%20fill%3D%22%230284c7%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22290%22%20r%3D%2214%22%20fill%3D%22%2338bdf8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22330%22%20r%3D%228%22%20fill%3D%22%2338bdf8%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2270%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%230369a1%22%20font-size%3D%2222%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%3E%F0%9F%92%A7%20Water%20Leakage%20Photo%20Evidence%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22370%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%2364748b%22%20font-size%3D%2214%22%20font-family%3D%22sans-serif%22%3EReported%20in%20Block%20A%20-%20Room%20302%3C%2Ftext%3E%3C%2Fsvg%3E',
    videoUrl: '',
    staffNotes: 'Plumber Assigned: Ah Seng. Replacement gasket and valve ordered from store.',
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
    imageUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20fill%3D%22%23fef3c7%22%20width%3D%22600%22%20height%3D%22400%22%2F%3E%3Cpolygon%20points%3D%22300%2C120%20330%2C200%20290%2C210%20320%2C290%20260%2C220%20295%2C210%22%20fill%3D%22%23d97706%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2270%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23b45309%22%20font-size%3D%2222%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%3E%E2%9A%A1%20Electrical%20Socket%20Issue%20Photo%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22350%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%2378350f%22%20font-size%3D%2214%22%20font-family%3D%22sans-serif%22%3EDryer%20%232%20Circuit%20in%20Laundry%20Room%3C%2Ftext%3E%3C%2Fsvg%3E',
    videoUrl: '',
    staffNotes: '',
    createdAt: Date.now() - 36000000
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
    description: 'The ceiling air conditioner remote is missing its battery cover and the blower fan makes a loud squeaking sound when set to high mode.',
    status: 'Resolved',
    floorplan: {
      floor: '3',
      x: 290,
      y: 335,
      roomName: 'Resident Study Lounge'
    },
    imageUrl: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20fill%3D%22%23d1fae5%22%20width%3D%22600%22%20height%3D%22400%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%22170%22%20width%3D%22200%22%20height%3D%2280%22%20rx%3D%228%22%20fill%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2270%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23047857%22%20font-size%3D%2222%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%3E%E2%9C%93%20Issue%20Inspected%20%26%20Resolved%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22350%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23065f46%22%20font-size%3D%2214%22%20font-family%3D%22sans-serif%22%3EStudy%20Lounge%20AC%20Fan%20Serviced%3C%2Ftext%3E%3C%2Fsvg%3E',
    videoUrl: '',
    staffNotes: 'Replaced fan bearing and supplied new remote with safety tether.',
    createdAt: Date.now() - 172800000
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

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initUser();
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
 * Replaces static fetching so the UI updates automatically on changes.
 */
function initRealtimeTickets() {
  // Start listening to live cloud updates
  listenToTickets((cloudTickets) => {
    if (cloudTickets && cloudTickets.length > 0) {
      currentReports = cloudTickets;
    } else {
      // Fallback to local storage or sample data if cloud database is empty
      const localReports = localStorage.getItem(APP_STORAGE_KEY);
      currentReports = localReports ? JSON.parse(localReports) : [...SAMPLE_REPORTS];
    }
    
    // Refresh statistics and UI elements automatically on every cloud update
    updateStats();
    renderReportList();
    console.log("Real-time sync: UI updated with latest cloud tickets.");
  });
}

function saveReports() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentReports));
  updateStats();
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

  // Pre-fill phone number with user's phone
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

  // Nav Links inside Drawer
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      navigate(targetView);
      closeSidebar();
    });
  });

  // Role Toggle Quick Button in Drawer
  const roleToggleBtn = document.getElementById('quick-role-toggle-btn');
  if (roleToggleBtn) {
    roleToggleBtn.addEventListener('click', () => {
      toggleUserRole();
    });
  }

  // Auth button in Drawer
  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', () => {
      closeSidebar();
      openLoginModal();
    });
  }

  // Handle URL hash navigation on load
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

  // Toggle active view sections
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

  // Update Drawer links active class
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update Header nav links active class
  document.querySelectorAll('.header-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-target') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Render directory list if navigating to report
  if (viewName === 'report') {
    renderReportList();
  }

  // Update browser URL hash without full reload
  window.history.replaceState(null, '', `#${viewName}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Middle Hero Button Action
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

  // Header display
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

  // Update navigation labels based on role
  if (headerReportNav) {
    headerReportNav.textContent = isStaff ? 'Ticket Directory (Staff)' : 'Submit Report';
  }
  if (drawerReportNav) {
    drawerReportNav.textContent = isStaff ? 'Ticket Directory (Staff)' : 'Submit Report';
  }
  if (heroSecondaryBtnText) {
    heroSecondaryBtnText.textContent = isStaff ? 'Staff Ticket Directory' : 'Track Your Ticket';
  }

  // Drawer display
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

  // Report view header labels
  const reportViewTitle = document.getElementById('report-view-title');
  const reportViewSubtitle = document.getElementById('report-view-subtitle');
  const roleViewBadge = document.getElementById('role-view-badge');

  if (reportViewTitle) {
    reportViewTitle.textContent = isStaff 
      ? 'Facility Maintenance Ticket Directory' 
      : 'Report Maintenance Issue';
  }
  if (reportViewSubtitle) {
    reportViewSubtitle.textContent = isStaff
      ? 'Review, search, and manage maintenance reports submitted by students across all hostel blocks.'
      : 'Submit maintenance tickets with media and floorplan pinning. Reports are securely handled by facility staff.';
  }
  if (roleViewBadge) {
    roleViewBadge.textContent = isStaff ? 'Staff Directory 🔒' : 'Resident Portal';
    roleViewBadge.className = isStaff
      ? 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-800'
      : 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-100 text-brand-700';
  }

  // Settings view display
  const sName = document.getElementById('settings-name');
  const sRole = document.getElementById('settings-role');
  const sUnit = document.getElementById('settings-unit');
  const sPhone = document.getElementById('settings-phone');
  if (sName) sName.textContent = currentUser.name;
  if (sRole) sRole.textContent = currentUser.roleLabel;
  if (sUnit) sUnit.textContent = currentUser.unit;
  if (sPhone) sPhone.textContent = currentUser.phone;

  // Student name in My Reports section
  const studentMyName = document.getElementById('student-my-name');
  if (studentMyName) studentMyName.textContent = currentUser.name;

  updateStats();
  renderReportList();
}

function toggleUserRole() {
  if (currentUser.role === 'student') {
    currentUser = { ...DEMO_ACCOUNTS.staff };
    showToast('Switched to Facility Staff Mode (Full Directory Unlocked) 🔧');
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
    setLoginRole(currentUser ? currentUser.role : 'student');
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('modal-open');
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

// import { syncUserToDatabase } from "./firebase-db.js";
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
  await syncUserToDatabase(currentUser);

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  closeLoginModal();
  updateUI();
  showToast(`Welcome back, ${currentUser.name}!`);
}

// ==========================================
// INTERACTIVE FLOORPLAN PIN SELECTION
// ==========================================
function initFloorplanDefaults() {
  // Pre-select Room 302 as starting demo pin
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

  // Check if click was inside a room zone
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

    // Auto-assist floorplan pin placement based on selection
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

// Drag & drop support
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
// FORM SUBMISSION & AUTOMATIC TICKET ID GENERATION
// ==========================================
async function handleReportSubmit(event) {
  event.preventDefault();

  // Validate Mandatory Photo Evidence
  if (!uploadedImageBase64) {
    alert('Mandatory Requirement: Please attach a photo of the maintenance issue.');
    document.getElementById('image-drop-area').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Validate Floorplan Location
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

  // AUTOMATICALLY GENERATE UNIQUE OFFICIAL TICKET ID
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newTicketId = `HK-2026-${randomNum}`;
  latestGeneratedTicketId = newTicketId;

  /* const displayLocation = locationType === 'Others' && customLocation 
    ? `Others (${customLocation})` 
    : locationType; */

  const newReport = {
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
  };

  // 1. SAVE TO FIRESTORE CLOUD DATABASE
  try {
    await submitTicketToDatabase(newReport);
    console.log("Ticket successfully pushed to Firebase!");
  } catch (error) {
    console.error("Error saving ticket to Firebase:", error);
  }

  // Prepend new report to local array for instant UI update
  currentReports.unshift(newReport);
  saveReports();

  // Reset form inputs
  document.getElementById('incident-report-form').reset();
  removeImageUpload();
  removeVideoUpload();
  clearFloorplanPin();
  initFormDateTime();

  // Close form panel & show success modal
  toggleReportForm(false);
  renderReportList();
  showTicketSuccessModal(newReport);
}

// Display Generated Ticket ID Modal
function showTicketSuccessModal(report) {
  const modal = document.getElementById('ticket-success-modal');
  const idEl = document.getElementById('success-ticket-id');
  const locEl = document.getElementById('success-ticket-location');
  const catEl = document.getElementById('success-ticket-category');
  const urgEl = document.getElementById('success-ticket-urgency');
  // const copyBtn = document.getElementById('copy-ticket-btn');
  const copyLabel = document.getElementById('copy-ticket-label');

  if (idEl) idEl.textContent = report.id;
  if (locEl) locEl.textContent = report.locationType === 'Others' && report.customLocation ? report.customLocation : report.locationType;
  if (catEl) catEl.textContent = report.category;
  if (urgEl) urgEl.textContent = report.urgency;
  if (copyLabel) copyLabel.textContent = 'Copy Ticket ID';

  if (modal) {
    modal.classList.add('modal-open');
  }
}

function closeTicketSuccessModal() {
  const modal = document.getElementById('ticket-success-modal');
  if (modal) modal.classList.remove('modal-open');
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
// STUDENT TICKET ID LOOKUP (ROLE-BASED TRACKING)
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

  // Find exact or partial matching report
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

  let statusClass = 'bg-amber-100 text-amber-800 border-amber-300';
  let statusDot = 'bg-amber-500';
  if (matched.status === 'In Progress') {
    statusClass = 'bg-blue-100 text-blue-800 border-blue-300';
    statusDot = 'bg-blue-500';
  } else if (matched.status === 'Resolved') {
    statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    statusDot = 'bg-emerald-500';
  }

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
          <span class="text-slate-400 font-bold uppercase text-[10px] block">Submitted Date:</span>
          <span class="font-semibold text-slate-800">${new Date(matched.datetime || matched.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <span class="font-bold text-slate-700 block mb-1">🛠️ Facility Staff Progress Update:</span>
        <p class="text-slate-600">${matched.staffNotes ? matched.staffNotes : 'Report received by maintenance department. Technician inspection is pending dispatch.'}</p>
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

  // Enforce Role-Based Visibility
  if (isStaff) {
    if (staffSection) staffSection.classList.remove('hidden');
    if (studentSection) studentSection.classList.add('hidden');
    renderStaffDirectory();
  } else {
    if (staffSection) staffSection.classList.add('hidden');
    if (studentSection) studentSection.classList.remove('hidden');
    renderStudentPersonalReports();
  }

  updateStats();
}

// 1. Staff Directory: Full Search by Ticket ID, Category, Location + Status Filtering
function renderStaffDirectory() {
  const container = document.getElementById('reports-container');
  const emptyState = document.getElementById('reports-empty-state');
  const searchInput = document.getElementById('directory-search');
  const searchQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();

  if (!container) return;

  // Filter reports specifically with Ticket ID matching
  const filtered = currentReports.filter(report => {
    const matchesStatus = currentFilter === 'all' || report.status === currentFilter;
    
    // Check Ticket ID match or general keyword
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

// 2. Student Directory: Only displays student's personal submitted reports
function renderStudentPersonalReports() {
  const container = document.getElementById('student-my-reports-list');
  const countBadge = document.getElementById('student-my-count');
  if (!container) return;

  // Filter only tickets submitted by current student
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

// Reusable Report Card HTML Generator
function createReportCardHTML(report, isStaffView) {
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
      <!-- Thumbnail Header -->
      <div class="relative h-44 bg-slate-100 overflow-hidden cursor-pointer" onclick="openReportDetail('${report.id}')">
        <img src="${report.imageUrl}" alt="Issue Evidence" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        
        <!-- Status Pill -->
        <div class="absolute top-3 left-3 flex items-center space-x-1.5">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusClass} flex items-center space-x-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            <span>${report.status}</span>
          </span>
        </div>

        <!-- Prominent Monospace Ticket ID Badge -->
        <div class="absolute top-3 right-3 flex items-center space-x-1">
          ${report.videoUrl ? '<span class="p-1 rounded-md bg-black/60 text-white text-xs" title="Has Video Clip">🎥</span>' : ''}
          <span class="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white font-mono text-xs font-bold border border-white/20 backdrop-blur-md shadow" title="Click to view details">
            ${report.id}
          </span>
        </div>

        <!-- Floorplan Location Strip -->
        <div class="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] truncate flex items-center space-x-1">
          <span>📍 Level ${report.floorplan ? report.floorplan.floor : '3'} : ${report.floorplan ? report.floorplan.roomName : displayLocation}</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>${report.category}</span>
            ${urgencyBadge}
          </div>
          <h3 class="font-bold text-slate-900 text-base leading-snug line-clamp-1">${displayLocation}</h3>
          <p class="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">${report.description}</p>
        </div>

        <!-- Card Footer -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="text-slate-400">
            <span>🕒 ${formattedDate}</span>
          </div>
          <button onclick="openReportDetail('${report.id}')" class="font-bold text-brand-600 hover:text-brand-800 transition-colors">
            ${isStaffView ? 'Manage Ticket 🛠️' : 'View Details →'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function updateStats() {
  const countAll = document.getElementById('count-all');
  const countPending = document.getElementById('count-pending');
  const countProgress = document.getElementById('count-progress');
  const countResolved = document.getElementById('count-resolved');
  const drawerBadge = document.getElementById('report-count-badge');
  const statActive = document.getElementById('stat-active');
  const statResolved = document.getElementById('stat-resolved');

  const pending = currentReports.filter(r => r.status === 'Pending').length;
  const inProgress = currentReports.filter(r => r.status === 'In Progress').length;
  const resolved = currentReports.filter(r => r.status === 'Resolved').length;

  if (countAll) countAll.textContent = currentReports.length;
  if (countPending) countPending.textContent = pending;
  if (countProgress) countProgress.textContent = inProgress;
  if (countResolved) countResolved.textContent = resolved;
  if (drawerBadge) drawerBadge.textContent = pending + inProgress;
  if (statActive) statActive.textContent = pending + inProgress;
  if (statResolved) statResolved.textContent = resolved;
}

// ==========================================
// REPORT DETAIL MODAL & STAFF ACTIONS
// ==========================================
function openReportDetail(reportId) {
  const report = currentReports.find(r => r.id === reportId);
  if (!report) return;

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
    <!-- Modal Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">🎫</span>
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xl font-extrabold font-mono text-slate-900">${report.id}</h2>
            <button onclick="navigator.clipboard.writeText('${report.id}'); showToast('Ticket ID copied!');" class="text-xs text-brand-600 hover:underline font-bold" title="Copy Ticket ID">
              [Copy ID]
            </button>
          </div>
          <p class="text-xs text-slate-500">${report.category} • ${report.urgency} Urgency</p>
        </div>
      </div>
      <button onclick="closeReportDetail()" class="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 text-sm">
        ✕
      </button>
    </div>

    <!-- Media Gallery: Photo (Mandatory) & Video (Optional) -->
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

    <!-- Incident Info Details -->
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

    <!-- Problem Description -->
    <div class="mt-4">
      <span class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Detailed Description</span>
      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
        ${report.description}
      </div>
    </div>

    <!-- Staff Resolution & Progress Notes Section -->
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
        <!-- STAFF EDIT CONTROLS -->
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
        <!-- STUDENT VIEW OF NOTES -->
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span class="font-bold text-slate-700">Staff Update:</span> 
          ${report.staffNotes ? report.staffNotes : 'No updates logged yet. A technician will review this ticket.'}
        </div>
      `}
    </div>

    <!-- Modal Footer Actions -->
    <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
      <button onclick="closeReportDetail()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors">
        Close
      </button>
    </div>
  `;

  modal.classList.add('modal-open');
}

function closeReportDetail() {
  const modal = document.getElementById('report-detail-modal');
  if (modal) modal.classList.remove('modal-open');
}

async function saveReportStaffUpdate(reportId) {
  const report = currentReports.find(r => r.id === reportId);
  if (!report) return;

  const newStatus = document.getElementById('modal-status-select').value;
  const newNotes = document.getElementById('modal-staff-notes').value;

  report.status = newStatus;
  report.staffNotes = newNotes;

  // Sync update to Firestore cloud database using the direct Firebase Doc ID
  try {
    await updateTicketStatusInDatabase(report.firebaseDocId, newStatus, newNotes);
  } catch (e) {
    console.error("Failed to sync status update to database:", e);
  }

  saveReports();
  renderReportList();
  closeReportDetail();
  showToast(`Ticket ${report.id} updated to "${newStatus}"!`);
}

// ==========================================
// DEMO RESET & CLEANUP
// ==========================================
function resetDemoData() {
  if (confirm('Reset to initial sample reports?')) {
    currentReports = [...SAMPLE_REPORTS];
    saveReports();
    renderReportList();
    showToast('Demo data reloaded successfully!');
  }
}

function clearAllData() {
  if (confirm('Clear all stored reports? This action cannot be undone.')) {
    currentReports = [];
    saveReports();
    renderReportList();
    showToast('All reports have been cleared.');
  }
}

// Toast Notification
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

// [Bottom of File] Add these window bindings to make inline onclick handlers work:
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
window.openReportDetail = openReportDetail;
window.closeReportDetail = closeReportDetail;
window.saveReportStaffUpdate = saveReportStaffUpdate;
window.resetDemoData = resetDemoData;
window.clearAllData = clearAllData;
window.navigate = navigate;