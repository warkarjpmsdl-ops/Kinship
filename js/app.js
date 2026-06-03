/* ==========================================================================
   KINSHIP MAIN CONTROLLER & APPLICATION ENGINE
   ========================================================================== */

import { 
  state, 
  employees, 
  communities, 
  initialAdviceThreads, 
  initialMarketplaceItems, 
  initialEvents, 
  hrAnalytics,
  calculateCompatibility 
} from './data.js';

import {
  createPersonalitySlidersHTML,
  createEmployeeCardHTML,
  generateIcebreakerHTML,
  createJourneyTimelineHTML,
  createAdviceCardHTML,
  createMarketplaceCardHTML,
  createSVGLineChartHTML,
  createRelationshipGraphSVG
} from './components.js';

// Setup local persistence arrays inside global state
state.adviceThreads = [...initialAdviceThreads];
state.marketplaceItems = [...initialMarketplaceItems];
state.events = [...initialEvents];

// DOM Element cache
const UI = {
  landingContainer: document.getElementById('view-landing'),
  authContainer: document.getElementById('view-auth'),
  onboardingContainer: document.getElementById('view-onboarding'),
  appShell: document.getElementById('app-shell'),
  viewContainer: document.getElementById('app-view-container'),
  viewTitle: document.getElementById('view-title'),
  viewSubtitle: document.getElementById('view-subtitle'),
  sidebarUserSummary: document.getElementById('sidebar-user-summary'),
  btnLogout: document.getElementById('btn-logout'),
  modal: document.getElementById('global-modal'),
  modalContent: document.getElementById('modal-content'),
  modalClose: document.getElementById('modal-close'),
  toastContainer: document.getElementById('toast-container'),
  bellTrigger: document.getElementById('bell-dropdown-trigger'),
  bellDropdown: document.getElementById('bell-dropdown'),
  bellList: document.getElementById('bell-notifications-list')
};

// Notification array
const notifications = [
  { id: 1, text: "Assigned buddy Sarah Jenkins sent you a welcome note.", time: "1 hour ago" },
  { id: 2, text: "Weekly Coffee Match matching is scheduled for Friday morning.", time: "4 hours ago" }
];

// App Init
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Bind global event listeners
  window.addEventListener('hashchange', router);
  UI.btnLogout.addEventListener('click', handleLogout);
  UI.modalClose.addEventListener('click', hideModal);
  
  // Close modal when clicking backdrop
  UI.modal.addEventListener('click', (e) => {
    if (e.target === UI.modal) hideModal();
  });

  // Bell dropdown handler
  UI.bellTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    UI.bellDropdown.classList.toggle('hidden');
    renderNotifications();
  });
  
  document.addEventListener('click', () => {
    UI.bellDropdown.classList.add('hidden');
  });

  // Initial routing check
  router();
}

// Global Router
function router() {
  const hash = window.location.hash || '#/landing';
  
  // Hide all main containers first
  UI.landingContainer.classList.add('hidden');
  UI.authContainer.classList.add('hidden');
  UI.onboardingContainer.classList.add('hidden');
  UI.appShell.classList.add('hidden');
  
  // Hide internal app views
  const appViews = document.querySelectorAll('.app-view');
  appViews.forEach(v => v.classList.add('hidden'));

  // Update navigation links state
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));

  // Check auth boundary
  const publicRoutes = ['#/landing', '#/login', '#/register'];
  if (!state.user.onboarded && !publicRoutes.includes(hash) && hash !== '#/onboarding') {
    window.location.hash = '#/landing';
    return;
  }

  // Routing Switch
  switch(hash) {
    case '#/landing':
      renderLanding();
      break;
    case '#/login':
    case '#/register':
      renderAuth(hash === '#/login' ? 'login' : 'register');
      break;
    case '#/onboarding':
      renderOnboarding();
      break;
    case '#/dashboard':
      showAppShell();
      highlightNavItem('nav-dashboard');
      renderDashboard();
      break;
    case '#/people':
      showAppShell();
      highlightNavItem('nav-people');
      renderPeopleDiscovery();
      break;
    case '#/communities':
      showAppShell();
      highlightNavItem('nav-communities');
      renderCommunities();
      break;
    case '#/events':
      showAppShell();
      highlightNavItem('nav-events');
      renderEvents();
      break;
    case '#/mentorship':
      showAppShell();
      highlightNavItem('nav-mentorship');
      renderMentorship();
      break;
    case '#/analytics':
      showAppShell();
      highlightNavItem('nav-analytics');
      renderHRAnalytics();
      break;
    default:
      window.location.hash = '#/landing';
  }

  // Re-bind Lucide icons for freshly injected templates
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 50);
}

// Highlight sidebar item
function highlightNavItem(id) {
  const element = document.getElementById(id);
  if (element) element.classList.add('active');
}

// Show app shell and set user info
function showAppShell() {
  UI.appShell.classList.remove('hidden');
  
  const initials = state.user.name.split(' ').map(n => n[0]).join('');
  UI.sidebarUserSummary.innerHTML = `
    <div class="avatar">${initials}</div>
    <div class="info">
      <span class="name">${state.user.name}</span>
      <span class="team">${state.user.role} &bull; ${state.user.department}</span>
    </div>
  `;
}

// Toast alerts
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" style="color: var(--color-${type})"></i>
    <span>${message}</span>
  `;
  UI.toastContainer.appendChild(toast);
  
  if (window.lucide) window.lucide.createIcons();

  // Slide out after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Modal handling
export function showModal(contentHTML) {
  UI.modalContent.innerHTML = contentHTML;
  UI.modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
  
  // Custom action bindings in modal
  const copyBtn = document.getElementById('btn-copy-icebreaker');
  const sendBtn = document.getElementById('btn-send-message-icebreaker');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('icebreaker-text-content').textContent.trim();
      navigator.clipboard.writeText(text);
      showToast("Icebreaker copied to clipboard!");
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', (e) => {
      const partnerId = parseInt(e.currentTarget.dataset.id);
      const partner = employees.find(emp => emp.id === partnerId);
      hideModal();
      showToast(`Icebreaker sent to ${partner.name}! Let's meet up!`);
      // Update state
      if (!state.user.scheduledChats.includes(partnerId)) {
        state.user.scheduledChats.push(partnerId);
      }
      router(); // Refresh view
    });
  }
}

function hideModal() {
  UI.modal.classList.add('hidden');
  UI.modalContent.innerHTML = '';
}

// Notifications dropdown
function renderNotifications() {
  if (notifications.length === 0) {
    UI.bellList.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No new notifications</div>`;
    return;
  }
  UI.bellList.innerHTML = notifications.map(n => `
    <div class="dropdown-item">
      <div style="font-weight: 500; margin-bottom: 0.15rem;">${n.text}</div>
      <div style="font-size: 0.7rem; color: var(--text-muted)">${n.time}</div>
    </div>
  `).join('');
}

// Log out handler
function handleLogout() {
  state.user.onboarded = false;
  showToast("Logged out successfully");
  window.location.hash = '#/landing';
}

/* ==========================================================
   VIEW RENDER FUNCTIONS
   ========================================================== */

// 1. LANDING PAGE
function renderLanding() {
  UI.landingContainer.classList.remove('hidden');
  
  // Custom mockup calculation preview inside landing
  const mockP1 = { introvertExtrovert: 30, casualDeep: 80, structuredSpontaneous: 20, morningEvening: 40, careerHobby: 50 };
  const mockP2 = { introvertExtrovert: 40, casualDeep: 85, structuredSpontaneous: 30, morningEvening: 30, careerHobby: 40 };
  const previewScore = calculateCompatibility(mockP1, mockP2);

  UI.landingContainer.innerHTML = `
    <!-- Landing Navigation -->
    <header class="landing-nav">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="24" fill="#4F46E5"/>
          <circle cx="38" cy="50" r="16" fill="white"/>
          <circle cx="62" cy="50" r="16" fill="white" fill-opacity="0.8"/>
          <circle cx="50" cy="50" r="8" fill="#4F46E5"/>
        </svg>
        <span class="logo-text" style="font-size: 1.5rem">kinship</span>
      </div>
      <div class="landing-nav-links">
        <a href="#how-it-works">How It Works</a>
        <a href="#outcomes">Outcomes</a>
        <a href="#/login" class="btn btn-outline btn-sm">Sign In</a>
        <a href="#/register" class="btn btn-primary btn-sm">Get Started</a>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="landing-hero">
      <div class="hero-tag">
        <i data-lucide="sparkles" style="width: 14px; height: 14px"></i> Introducing Kinship WROS
      </div>
      <h1>Work with people.<br>Connect with humans.</h1>
      <p>The Relationship Operating System designed to help hybrid and remote teams build authentic friendships, accelerate onboarding, and align cross-functional departments.</p>
      <div class="landing-hero-ctas">
        <a href="#/register" class="btn btn-primary btn-md">Get Started</a>
        <a href="#how-it-works" class="btn btn-outline btn-md">Explore Features</a>
      </div>
    </section>

    <!-- Hero Mockup Demo Row -->
    <section class="hero-mockups">
      <div class="mockup-card text-center" style="background: radial-gradient(circle at 100% 0%, var(--indigo-soft) 0%, var(--bg-card) 70%)">
        <span class="badge badge-success font-semibold mb-3" style="margin-bottom: 1rem">${previewScore}% Human Compatibility</span>
        <div class="d-flex align-center gap-3 mb-4" style="margin-bottom: 1rem; justify-content: center">
          <div class="avatar" style="width: 48px; height: 48px; font-size: 1.1rem; background-color: var(--indigo-soft)">AM</div>
          <i data-lucide="arrow-left-right" class="text-muted"></i>
          <div class="avatar" style="width: 48px; height: 48px; font-size: 1.1rem; background-color: var(--color-success-bg); color: var(--color-success)">SJ</div>
        </div>
        <h4 class="font-semibold text-md mb-2">Alex &bull; Sarah</h4>
        <p class="text-xs text-muted" style="line-height: 1.4">Matched because you are both introverted night owls who enjoy photography and deep, spontaneous chats.</p>
      </div>

      <div class="mockup-card">
        <div class="d-flex align-center justify-between mb-4" style="margin-bottom: 1rem;">
          <h4 class="font-semibold text-sm">New Hire Accelerator</h4>
          <span class="badge badge-indigo">Active</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem;">
          <div class="d-flex align-center gap-2"><i data-lucide="check-circle-2" style="color: var(--color-success); width: 14px; height: 14px"></i> Day 1: Assigned Buddy</div>
          <div class="d-flex align-center gap-2"><i data-lucide="check-circle-2" style="color: var(--color-success); width: 14px; height: 14px"></i> Day 3: Scheduled Coffee Match</div>
          <div class="d-flex align-center gap-2" style="color: var(--indigo-primary); font-weight: 600"><i data-lucide="circle" style="width: 14px; height: 14px"></i> Day 7: Join Fitness Community</div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="landing-grid-section" id="how-it-works">
      <div class="section-headline">
        <h2>Built for Human Connection</h2>
        <p>We replace corporate dashboards and endless chat logs with structured, real-world interactions.</p>
      </div>
      
      <div class="feature-cards-grid">
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="sliders"></i></div>
          <h3>Personality Layer</h3>
          <p>We map 5 axes of social alignment. We connect employees based on real personality compatibility, not just keyword overlap.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="cpu"></i></div>
          <h3>AI Workplace Concierge</h3>
          <p>No cold browsing. Our smart system guides new hires by suggesting specific colleagues, relevant communities, and activities immediately.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="message-square"></i></div>
          <h3>AI Icebreakers</h3>
          <p>Remove the anxiety of the first message. We generate custom conversation starters derived from mutual compatibility scores.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="shield-alert"></i></div>
          <h3>Anonymous Advice</h3>
          <p>Empower new hires to ask questions without fear. Support community guidelines on general topics and corporate logistics anonymously.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="handshake"></i></div>
          <h3>Trust Marketplace</h3>
          <p>Commute rides, badminton games, or apartment moving help. Drive interaction through mutual exchange and non-monetary assistance.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i data-lucide="milestone"></i></div>
          <h3>New Hire Accelerator</h3>
          <p>Automated timelines built for HR templates. Fulfill onboarding roadmaps with buddy pairings, coffee chats, and community introductions.</p>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="landing-grid-section" id="outcomes" style="background-color: var(--bg-card); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); max-width: 100%; margin: 6rem 0; padding: 6rem 2rem;">
      <div style="max-width: 1100px; margin: 0 auto">
        <div class="section-headline">
          <h2>Loved by Teams. Valued by Leaders.</h2>
          <p>We transform organizational culture by improving cross-functional bridges and new hire integration speed.</p>
        </div>
        
        <div class="testimonial-grid">
          <div class="testimonial-card">
            <p class="testimonial-quote">"Onboarding remote is normally lonely, but Kinship gave me an accelerator roadmap and a coffee buddy on day 1. I felt integrated in two weeks."</p>
            <div class="testimonial-author">
              <div class="avatar" style="background-color: var(--indigo-soft)">AM</div>
              <div>
                <div class="font-semibold text-sm">Alex Mercer</div>
                <div class="text-xs text-muted">Designer at Soudal</div>
              </div>
            </div>
          </div>
          
          <div class="testimonial-card">
            <p class="testimonial-quote">"We monitored our connection health scores and noticed a massive isolation risk in Sales. Kinship gave us actionable steps to fix it. Cross-team collaboration rose 28%."</p>
            <div class="testimonial-author">
              <div class="avatar" style="background-color: var(--color-success-bg); color: var(--color-success)">ER</div>
              <div>
                <div class="font-semibold text-sm">Elena Rostova</div>
                <div class="text-xs text-muted">Chief People Officer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer style="text-align: center; padding: 3rem 0; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-muted)">
      &copy; 2026 Kinship Technologies, Inc. All rights reserved. &bull; Calming, Secure, Human.
    </footer>
  `;
}

// 2. AUTHENTICATION (Login / Register)
function renderAuth(mode = 'login') {
  UI.authContainer.classList.remove('hidden');
  
  const isLogin = mode === 'login';
  
  UI.authContainer.innerHTML = `
    <div class="auth-page-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo justify-between" style="justify-content: center; margin-bottom: 1.5rem">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="24" fill="#4F46E5"/>
              <circle cx="38" cy="50" r="16" fill="white"/>
              <circle cx="62" cy="50" r="16" fill="white" fill-opacity="0.8"/>
              <circle cx="50" cy="50" r="8" fill="#4F46E5"/>
            </svg>
          </div>
          <h2>${isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p class="text-xs text-secondary">Join your organization's WROS environment.</p>
        </div>

        <div class="auth-social-buttons">
          <button class="btn btn-outline w-full text-sm align-center justify-between sso-btn" data-provider="Google">
            <i data-lucide="chrome" style="width: 16px; height: 16px; color: var(--text-muted)"></i>
            <span style="flex-grow: 1; text-align: center">Continue with Google</span>
          </button>
          <button class="btn btn-outline w-full text-sm align-center justify-between sso-btn" data-provider="Microsoft">
            <i data-lucide="terminal" style="width: 16px; height: 16px; color: var(--text-muted)"></i>
            <span style="flex-grow: 1; text-align: center">Continue with Microsoft AD</span>
          </button>
        </div>

        <div class="auth-divider">or use email</div>

        <form id="auth-form" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label">Work Email</label>
            <input type="email" placeholder="you@company.com" class="form-input" required id="auth-email">
          </div>
          ${!isLogin ? `
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" placeholder="Alex Mercer" class="form-input" required id="auth-name">
            </div>
          ` : ''}
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" placeholder="••••••••" class="form-input" required>
          </div>
          
          <button type="submit" class="btn btn-primary w-full text-sm font-semibold mt-4" id="btn-submit-auth">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div class="text-center mt-6" style="margin-top: 1.5rem; font-size: 0.8rem">
          ${isLogin ? `
            <span class="text-muted">New hire?</span>
            <a href="#/register" class="font-semibold">Create corporate profile</a>
          ` : `
            <span class="text-muted">Already have a profile?</span>
            <a href="#/login" class="font-semibold">Sign In</a>
          `}
        </div>
      </div>
    </div>
  `;

  // SSO and Form bindings
  const ssoButtons = UI.authContainer.querySelectorAll('.sso-btn');
  ssoButtons.forEach(btn => btn.addEventListener('click', (e) => {
    const provider = e.currentTarget.dataset.provider;
    handleSuccessfulAuth(`SSO Authenticated via ${provider}`);
  }));

  const form = document.getElementById('auth-form');
  form.addEventListener('submit', () => {
    const email = document.getElementById('auth-email').value;
    const nameInput = document.getElementById('auth-name');
    if (nameInput) state.user.name = nameInput.value;
    handleSuccessfulAuth(`Authenticated as ${email}`);
  });
}

function handleSuccessfulAuth(msg) {
  showToast(msg);
  // Simulating routing check
  if (state.user.onboarded) {
    window.location.hash = '#/dashboard';
  } else {
    window.location.hash = '#/onboarding';
  }
}

// 3. ONBOARDING FLOW
function renderOnboarding() {
  UI.onboardingContainer.classList.remove('hidden');
  
  let currentStep = 1;
  const onboardingData = {
    name: state.user.name,
    role: state.user.role,
    department: state.user.department,
    location: state.user.location,
    interests: [...state.user.interests],
    skills: [...state.user.skills],
    skillsToLearn: [...state.user.skillsToLearn],
    personality: { ...state.user.personality }
  };

  const allInterests = ["Photography", "Gaming", "Books", "Fitness", "Travel", "Yoga", "Chess", "Running", "DIY Projects", "Cooking", "Baking", "Formula 1", "Music", "Anime", "Philosophy"];
  const allSkills = ["UI/UX Design", "Product Strategy", "React", "Node.js", "System Design", "Copywriting", "SQL", "Public Speaking", "SEO", "Brand Strategy", "Data Analytics"];

  function updateOnboardingContent() {
    let stepHTML = "";
    let stepTitle = "";
    let stepSubtitle = "";
    let progressVal = "25%";

    if (currentStep === 1) {
      progressVal = "25%";
      stepTitle = "About You";
      stepSubtitle = "Tell us what you do and where you are located.";
      stepHTML = `
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" value="${onboardingData.name}" class="form-input" id="ob-name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Corporate Role</label>
          <input type="text" value="${onboardingData.role}" class="form-input" id="ob-role" required>
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-input" id="ob-dept">
            <option value="Product" ${onboardingData.department === 'Product' ? 'selected' : ''}>Product & Design</option>
            <option value="Engineering" ${onboardingData.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
            <option value="Marketing" ${onboardingData.department === 'Marketing' ? 'selected' : ''}>Marketing & Comms</option>
            <option value="Operations" ${onboardingData.department === 'Operations' ? 'selected' : ''}>Operations</option>
            <option value="Sales" ${onboardingData.department === 'Sales' ? 'selected' : ''}>Sales & Accounts</option>
            <option value="HR" ${onboardingData.department === 'HR' ? 'selected' : ''}>HR / People Team</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Location Status</label>
          <select class="form-input" id="ob-loc">
            <option value="Hybrid NYC" ${onboardingData.location === 'Hybrid NYC' ? 'selected' : ''}>Hybrid NYC HQ</option>
            <option value="Hybrid SF" ${onboardingData.location === 'Hybrid SF' ? 'selected' : ''}>Hybrid SF Hub</option>
            <option value="Hybrid London" ${onboardingData.location === 'Hybrid London' ? 'selected' : ''}>Hybrid London Hub</option>
            <option value="Remote" ${onboardingData.location.includes('Remote') ? 'selected' : ''}>Fully Remote</option>
          </select>
        </div>
      `;
    } else if (currentStep === 2) {
      progressVal = "50%";
      stepTitle = "Personality Mapping";
      stepSubtitle = "Map your work social traits. We use this to compute the Human Compatibility Score™.";
      stepHTML = `
        <div id="personality-sliders-box">
          ${createPersonalitySlidersHTML(onboardingData.personality)}
        </div>
      `;
    } else if (currentStep === 3) {
      progressVal = "75%";
      stepTitle = "Interests & Skills";
      stepSubtitle = "Select your hobbies and skills so colleagues can discover you.";
      stepHTML = `
        <div class="form-group">
          <label class="form-label">Your Fields of Interest (Choose 3+)</label>
          <div class="onboarding-chip-grid">
            ${allInterests.map(interest => {
              const active = onboardingData.interests.includes(interest);
              return `<span class="chip interest-chip ${active ? 'active' : ''}" data-val="${interest}">${interest}</span>`;
            }).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Skills you possess</label>
          <div class="onboarding-chip-grid" style="max-height: 120px;">
            ${allSkills.map(skill => {
              const active = onboardingData.skills.includes(skill);
              return `<span class="chip skill-pos-chip ${active ? 'active' : ''}" data-val="${skill}">${skill}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    } else if (currentStep === 4) {
      progressVal = "100%";
      stepTitle = "Accelerator Program";
      stepSubtitle = "Would you like to participate in active mentorship and peer pairing?";
      stepHTML = `
        <div class="form-group">
          <label class="form-label">Onboarding Accelerator Role</label>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <label class="card d-flex align-center gap-4 cursor-pointer" style="flex-direction: row; padding: 1rem; border-color: var(--indigo-primary); cursor: pointer;">
              <input type="radio" name="ob-acc" value="buddy" checked style="accent-color: var(--indigo-primary)">
              <div class="text-left">
                <div class="font-semibold text-sm">Assign Buddy Roadmap</div>
                <div class="text-xs text-secondary">Get paired with Sarah Jenkins for weekly check-ins and department acceleration.</div>
              </div>
            </label>
            <label class="card d-flex align-center gap-4 cursor-pointer" style="flex-direction: row; padding: 1rem; cursor: pointer;">
              <input type="radio" name="ob-acc" value="mentor" style="accent-color: var(--indigo-primary)">
              <div class="text-left">
                <div class="font-semibold text-sm">Find professional Mentor</div>
                <div class="text-xs text-secondary">Match with senior staff members for skills mapping and career advice.</div>
              </div>
            </label>
          </div>
        </div>
      `;
    }

    UI.onboardingContainer.innerHTML = `
      <div class="onboarding-page-wrapper">
        <div class="onboarding-card">
          <div class="onboarding-progress-bar-container">
            <div class="onboarding-progress-bar" style="width: ${progressVal}"></div>
          </div>
          
          <div class="onboarding-step">
            <h2 class="onboarding-title">${stepTitle}</h2>
            <p class="onboarding-subtitle">${stepSubtitle}</p>
            
            <div class="onboarding-form-fields">
              ${stepHTML}
            </div>
            
            <div class="onboarding-buttons">
              <button class="btn btn-outline" id="ob-btn-back" ${currentStep === 1 ? 'disabled' : ''}>Back</button>
              <button class="btn btn-primary" id="ob-btn-next">
                ${currentStep === 4 ? 'Complete Setup' : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook listeners
    const nextBtn = document.getElementById('ob-btn-next');
    const backBtn = document.getElementById('ob-btn-back');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
          saveCurrentStepData();
          currentStep--;
          updateOnboardingContent();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        saveCurrentStepData();
        if (currentStep < 4) {
          currentStep++;
          updateOnboardingContent();
        } else {
          // Submit Onboarding
          Object.assign(state.user, onboardingData);
          state.user.onboarded = true;
          showToast("WROS Profile successfully initialized!");
          window.location.hash = '#/dashboard';
        }
      });
    }

    // Toggle chip selections in Step 3
    if (currentStep === 3) {
      const interestChips = UI.onboardingContainer.querySelectorAll('.interest-chip');
      interestChips.forEach(chip => chip.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.val;
        if (onboardingData.interests.includes(val)) {
          onboardingData.interests = onboardingData.interests.filter(i => i !== val);
          e.currentTarget.classList.remove('active');
        } else {
          onboardingData.interests.push(val);
          e.currentTarget.classList.add('active');
        }
      }));

      const skillChips = UI.onboardingContainer.querySelectorAll('.skill-pos-chip');
      skillChips.forEach(chip => chip.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.val;
        if (onboardingData.skills.includes(val)) {
          onboardingData.skills = onboardingData.skills.filter(i => i !== val);
          e.currentTarget.classList.remove('active');
        } else {
          onboardingData.skills.push(val);
          e.currentTarget.classList.add('active');
        }
      }));
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function saveCurrentStepData() {
    if (currentStep === 1) {
      onboardingData.name = document.getElementById('ob-name').value;
      onboardingData.role = document.getElementById('ob-role').value;
      onboardingData.department = document.getElementById('ob-dept').value;
      onboardingData.location = document.getElementById('ob-loc').value;
    } else if (currentStep === 2) {
      const sliders = UI.onboardingContainer.querySelectorAll('.personality-slider');
      sliders.forEach(slider => {
        const key = slider.dataset.key;
        onboardingData.personality[key] = parseInt(slider.value);
      });
    } else if (currentStep === 4) {
      const activeRadio = UI.onboardingContainer.querySelector('input[name="ob-acc"]:checked');
      if (activeRadio) {
        onboardingData.acceleratorType = activeRadio.value;
      }
    }
  }

  // Initial step render
  updateOnboardingContent();
}

// 4. HOME DASHBOARD
function renderDashboard() {
  const container = document.getElementById('view-dashboard');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Dashboard";
  UI.viewSubtitle.textContent = `Welcome back, ${state.user.name.split(' ')[0]} 👋 Here is your trust roadmap.`;

  // Calculate Match of the week: Find highest compatibility employee
  const candidates = employees.filter(emp => emp.id !== 4); // Skip buddy Sarah
  let bestMatch = candidates[0];
  let maxScore = 0;
  
  candidates.forEach(emp => {
    const score = calculateCompatibility(state.user.personality, emp.personality);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = emp;
    }
  });

  // Check if already booked coffee
  const coffeeBooked = state.user.scheduledChats.includes(bestMatch.id);

  // Suggested colleague to break the bubble (different dept)
  const bubbleCandidate = employees.find(emp => emp.department !== state.user.department && emp.id !== bestMatch.id);
  const bubbleScore = calculateCompatibility(state.user.personality, bubbleCandidate.personality);

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Left side: AI Concierge, Coffee Match, Bubble matching -->
      <div class="d-flex flex-direction-column gap-6" style="flex-direction: column;">
        
        <!-- AI Workplace Concierge Widget -->
        <div class="concierge-banner">
          <div class="concierge-text">
            <h2>AI Workplace Concierge</h2>
            <p>Welcome! We recommend introducing yourself to <strong>${bestMatch.name.split(' ')[0]} (${bestMatch.role})</strong> and joining the <strong>Photography Circle</strong> community to match your interests.</p>
          </div>
          <div class="concierge-avatar-pile">
            <div class="avatar" title="Sarah Jenkins (Buddy)">SJ</div>
            <div class="avatar" style="background-color: var(--color-success-bg); color: var(--color-success)" title="${bestMatch.name}">${bestMatch.name.split(' ').map(n=>n[0]).join('')}</div>
            <div class="avatar" style="background-color: var(--color-info-bg); color: var(--color-info)" title="${bubbleCandidate.name}">${bubbleCandidate.name.split(' ').map(n=>n[0]).join('')}</div>
          </div>
        </div>

        <!-- Coffee Match of the Week -->
        <div class="card match-week-card">
          <div class="card-header">
            <div>
              <span class="hero-tag" style="margin-bottom: 0.5rem"><i data-lucide="coffee" style="width: 14px; height: 14px"></i> Coffee Match of the Week</span>
              <h3 class="card-title">1-on-1 Coffee Chat Partner</h3>
            </div>
            <span class="badge badge-success font-semibold">${maxScore}% Compatibility</span>
          </div>

          <div class="match-profile-row">
            <div class="match-profile-avatar">${bestMatch.name.split(' ').map(n=>n[0]).join('')}</div>
            <div>
              <h4 class="font-semibold text-md">${bestMatch.name}</h4>
              <p class="text-xs text-secondary">${bestMatch.role} &bull; ${bestMatch.department}</p>
            </div>
          </div>

          <div class="icebreaker-box">
            <div class="icebreaker-title">
              <i data-lucide="cpu" class="text-xs"></i> AI Icebreaker Generator
            </div>
            <div class="icebreaker-content">
              "You both enjoy ${bestMatch.interests.filter(i => state.user.interests.includes(i))[0] || 'your fields of work'} and score high on deep evening conversations. Ask: 'Hey ${bestMatch.name.split(' ')[0]}! Kinship matched us for coffee. Who do you think pulls off the podium finish this weekend?'"
            </div>
          </div>

          <div class="d-flex gap-3" style="margin-top: 1rem;">
            ${coffeeBooked ? `
              <button class="btn btn-secondary btn-sm flex-grow" disabled>Coffee Scheduled! Check Inbox</button>
            ` : `
              <button class="btn btn-primary btn-sm flex-grow book-coffee-btn" data-id="${bestMatch.id}">Book Coffee Session</button>
            `}
            <button class="btn btn-outline btn-sm icebreaker-trigger-btn" data-id="${bestMatch.id}">Show All Icebreakers</button>
          </div>
        </div>

        <!-- Meet Outside Your Bubble -->
        <div class="card bubble-rec-card">
          <div class="card-header">
            <div>
              <span class="badge badge-indigo text-xs mb-1" style="margin-bottom: 0.25rem;">Meet Outside Your Bubble</span>
              <h3 class="card-title">Cross-Team Gluing</h3>
            </div>
            <span class="badge badge-indigo font-semibold">${bubbleScore}% Match</span>
          </div>
          <p class="text-sm text-secondary mb-4" style="margin-bottom: 1rem;">
            We intentionally found <strong>${bubbleCandidate.name}</strong> from <strong>${bubbleCandidate.department}</strong> to help you bridge bubbles. Shared traits: both night owls.
          </p>
          <div class="d-flex align-center gap-3">
            <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${bubbleCandidate.name.split(' ').map(n=>n[0]).join('')}</div>
            <div style="flex-grow: 1;">
              <div class="font-semibold text-sm">${bubbleCandidate.name}</div>
              <div class="text-xs text-muted">${bubbleCandidate.role}</div>
            </div>
            <button class="btn btn-outline btn-sm book-coffee-btn" data-id="${bubbleCandidate.id}">Schedule Coffee</button>
          </div>
        </div>

      </div>

      <!-- Right side: Journey Timeline, Upcoming Events -->
      <div class="d-flex flex-direction-column gap-6" style="flex-direction: column;">
        
        <!-- My Journey Widget -->
        <div class="card">
          <h3 class="card-title mb-4" style="margin-bottom: 1.25rem;">My Journey</h3>
          ${createJourneyTimelineHTML(state.user)}
        </div>

        <!-- Upcoming RSVPs -->
        <div class="card">
          <h3 class="card-title mb-4" style="margin-bottom: 1.25rem;">Upcoming Events</h3>
          <div class="d-flex flex-direction-column gap-3" style="flex-direction: column;" id="dashboard-events-list">
            <!-- Events injected here -->
          </div>
        </div>

      </div>
    </div>
  `;

  // Render dashboard events
  const dbEventsList = document.getElementById('dashboard-events-list');
  const userEvents = state.events.filter(e => state.user.rsvpedEvents.includes(e.id));
  
  if (userEvents.length === 0) {
    dbEventsList.innerHTML = `<div class="text-xs text-muted">You haven't RSVP'd to any events. <a href="#/events" class="font-semibold">Explore Events</a></div>`;
  } else {
    dbEventsList.innerHTML = userEvents.map(e => `
      <div class="d-flex align-center justify-between pb-2" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
        <div>
          <div class="font-semibold text-sm">${e.title}</div>
          <div class="text-xs text-muted">${e.date.month} ${e.date.day} &bull; ${e.time}</div>
        </div>
        <i data-lucide="check-circle" style="color: var(--color-success); width: 18px; height: 18px;"></i>
      </div>
    `).join('');
  }

  // Hook Book Coffee click handlers
  const coffeeBtns = container.querySelectorAll('.book-coffee-btn');
  coffeeBtns.forEach(btn => btn.addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    const partner = employees.find(emp => emp.id === id);
    if (!state.user.scheduledChats.includes(id)) {
      state.user.scheduledChats.push(id);
    }
    showToast(`Coffee Chat scheduled with ${partner.name}! Invite sent to calendar.`);
    router();
  }));

  // Icebreakers trigger
  const icebreakerBtns = container.querySelectorAll('.icebreaker-trigger-btn');
  icebreakerBtns.forEach(btn => btn.addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    const partner = employees.find(emp => emp.id === id);
    showModal(generateIcebreakerHTML(partner, state.user));
  }));
}

// 5. PEOPLE DISCOVERY (Directory & Cross-Team)
function renderPeopleDiscovery() {
  const container = document.getElementById('view-people');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Directory";
  UI.viewSubtitle.textContent = "Discover teammates and map compatibility.";

  // Filters state
  let selectedDepts = [];
  let selectedInterests = [];
  let showBubbleBreakers = false;

  const allDepts = ["Product", "Engineering", "Marketing", "Operations", "Sales", "HR"];
  const popularInterests = ["Photography", "Gaming", "Books", "Fitness", "Travel", "Running", "Chess", "Formula 1"];

  function filterAndRenderGrid() {
    let filtered = employees;

    // Filter by search query
    const query = document.getElementById('search-dir').value.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(emp => emp.name.toLowerCase().includes(query) || emp.role.toLowerCase().includes(query));
    }

    // Filter by departments
    if (selectedDepts.length > 0) {
      filtered = filtered.filter(emp => selectedDepts.includes(emp.department));
    }

    // Filter by interests
    if (selectedInterests.length > 0) {
      filtered = filtered.filter(emp => emp.interests.some(i => selectedInterests.includes(i)));
    }

    // Filter bubble breakers (different dept)
    if (showBubbleBreakers) {
      filtered = filtered.filter(emp => emp.department !== state.user.department);
    }

    const grid = document.getElementById('employee-directory-grid');
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 3rem; color: var(--text-muted)">No matching colleagues found. Try relaxing filters!</div>`;
      return;
    }

    grid.innerHTML = filtered.map(emp => createEmployeeCardHTML(emp, state.user)).join('');

    // Re-bind Lucide for cards
    if (window.lucide) window.lucide.createIcons();

    // Re-bind actions inside grid
    const bookBtns = grid.querySelectorAll('.book-coffee-btn');
    bookBtns.forEach(btn => btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const partner = employees.find(emp => emp.id === id);
      if (!state.user.scheduledChats.includes(id)) {
        state.user.scheduledChats.push(id);
      }
      showToast(`Coffee invite sent to ${partner.name}! Check your Google calendar.`);
      filterAndRenderGrid();
    }));

    const iceBtn = grid.querySelectorAll('.icebreaker-trigger-btn');
    iceBtn.forEach(btn => btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const partner = employees.find(emp => emp.id === id);
      showModal(generateIcebreakerHTML(partner, state.user));
    }));
  }

  // Build View shell
  container.innerHTML = `
    <div class="directory-layout">
      <!-- Left side: Filters Sidebar -->
      <aside class="filter-panel">
        <div class="filter-section">
          <div class="filter-title">Cross-Team Filters</div>
          <label class="filter-checkbox-label">
            <input type="checkbox" id="chk-bubble">
            <span>Outside My Bubble</span>
          </label>
        </div>

        <div class="filter-section">
          <div class="filter-title">Departments</div>
          <div class="filter-checkbox-list">
            ${allDepts.map(dept => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="dept-filter-chk" value="${dept}">
                <span>${dept}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-title">Popular Hobbies</div>
          <div class="filter-checkbox-list">
            ${popularInterests.map(interest => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="interest-filter-chk" value="${interest}">
                <span>${interest}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </aside>

      <!-- Right side: Search bar & Grid -->
      <div class="directory-main">
        <div class="search-bar-wrapper">
          <div class="search-input-group">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Search name, role, department..." class="form-input" id="search-dir">
          </div>
        </div>

        <div class="employee-grid" id="employee-directory-grid">
          <!-- Injected dynamically -->
        </div>
      </div>
    </div>
  `;

  // Bind filter events
  const searchInput = document.getElementById('search-dir');
  searchInput.addEventListener('input', filterAndRenderGrid);

  const bubbleChk = document.getElementById('chk-bubble');
  bubbleChk.addEventListener('change', (e) => {
    showBubbleBreakers = e.target.checked;
    filterAndRenderGrid();
  });

  const deptChks = container.querySelectorAll('.dept-filter-chk');
  deptChks.forEach(chk => chk.addEventListener('change', () => {
    selectedDepts = Array.from(deptChks).filter(c => c.checked).map(c => c.value);
    filterAndRenderGrid();
  }));

  const intChks = container.querySelectorAll('.interest-filter-chk');
  intChks.forEach(chk => chk.addEventListener('change', () => {
    selectedInterests = Array.from(intChks).filter(c => c.checked).map(c => c.value);
    filterAndRenderGrid();
  }));

  // Initial render
  filterAndRenderGrid();
}

// 6. COMMUNITIES, ADVICE BOARDS, MARKETPLACE
function renderCommunities() {
  const container = document.getElementById('view-communities');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Communities";
  UI.viewSubtitle.textContent = "Engage in interest groups, anonymous advice, and mutual assistance.";

  let activeTab = "groups"; // groups, advice, marketplace

  function switchTab(tabId) {
    activeTab = tabId;
    
    // Toggle button active classes
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Render tab bodies
    const tabBody = document.getElementById('communities-tab-body');
    if (tabId === "groups") {
      renderGroups(tabBody);
    } else if (tabId === "advice") {
      renderAdvice(tabBody);
    } else if (tabId === "marketplace") {
      renderMarketplace(tabBody);
    }
  }

  // Views Shell Setup
  container.innerHTML = `
    <div class="tab-container">
      <button class="tab-btn active" data-tab="groups">Hobby & Work Clubs</button>
      <button class="tab-btn" data-tab="advice">Anonymous Advice Board</button>
      <button class="tab-btn" data-tab="marketplace">Help Marketplace</button>
    </div>
    
    <div id="communities-tab-body">
      <!-- Dynamic tab body loaded here -->
    </div>
  `;

  // Bind tabs
  const tabBtns = container.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => btn.addEventListener('click', (e) => {
    switchTab(e.currentTarget.dataset.tab);
  }));

  // Render initial tab
  switchTab("groups");
}

function renderGroups(targetNode) {
  targetNode.innerHTML = `
    <div class="communities-grid">
      ${communities.map(comm => {
        const isJoined = state.user.joinedCommunities.includes(comm.name);
        return `
          <div class="card community-card">
            <div class="community-card-icon">
              <i data-lucide="${comm.icon}"></i>
            </div>
            <h3 class="card-title mb-2">${comm.name}</h3>
            <p class="text-xs text-secondary mb-4" style="line-height: 1.5; margin-bottom: 1.25rem;">${comm.description}</p>
            
            <div class="community-meta-row">
              <span>${comm.members} Members</span>
              <button class="btn ${isJoined ? 'btn-outline' : 'btn-primary'} btn-sm join-group-btn" data-name="${comm.name}">
                ${isJoined ? 'Joined' : 'Join Club'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind Join/Leave toggles
  const joinBtns = targetNode.querySelectorAll('.join-group-btn');
  joinBtns.forEach(btn => btn.addEventListener('click', (e) => {
    const name = e.currentTarget.dataset.name;
    const index = state.user.joinedCommunities.indexOf(name);
    if (index > -1) {
      state.user.joinedCommunities.splice(index, 1);
      showToast(`Left the ${name} community`);
    } else {
      state.user.joinedCommunities.push(name);
      showToast(`Joined the ${name} community! Welcome!`);
    }
    renderGroups(targetNode); // refresh
  }));
}

function renderAdvice(targetNode) {
  let activeCategory = "All Threads";
  const categories = ["All Threads", "First Year Survival", "Work Life & Balance", "Hybrid Work Tips"];

  function filterAndRenderThreads() {
    let listHTML = "";
    let filtered = state.adviceThreads;
    
    if (activeCategory !== "All Threads") {
      filtered = filtered.filter(t => t.category === activeCategory);
    }

    if (filtered.length === 0) {
      listHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted)">No advice threads in this category yet. Start one!</div>`;
    } else {
      listHTML = filtered.map(t => createAdviceCardHTML(t)).join('');
    }

    const listContainer = document.getElementById('threads-list-box');
    if (listContainer) {
      listContainer.innerHTML = listHTML;
      if (window.lucide) window.lucide.createIcons();
      
      // Bind like handlers
      const likeBtns = listContainer.querySelectorAll('.btn-like-thread');
      likeBtns.forEach(btn => btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const thread = state.adviceThreads.find(t => t.id === id);
        thread.likes++;
        filterAndRenderThreads();
      }));

      // Bind submit replies
      const replyInputs = listContainer.querySelectorAll('.reply-input');
      replyInputs.forEach(input => input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitReply(parseInt(e.currentTarget.dataset.id));
      }));
      const replyBtns = listContainer.querySelectorAll('.submit-reply-btn');
      replyBtns.forEach(btn => btn.addEventListener('click', (e) => {
        submitReply(parseInt(e.currentTarget.dataset.id));
      }));
    }
  }

  function submitReply(threadId) {
    const thread = state.adviceThreads.find(t => t.id === threadId);
    const containerNode = document.querySelector(`[data-thread-id="${threadId}"]`);
    const input = containerNode.querySelector('.reply-input');
    const replyVal = input.value.trim();
    if (!replyVal) return;

    thread.replies.push({
      author: `${state.user.name} (You)`,
      body: replyVal,
      timestamp: "Just now"
    });

    input.value = "";
    showToast("Reply posted successfully!");
    filterAndRenderThreads();
  }

  targetNode.innerHTML = `
    <div class="advice-board-layout">
      <!-- Left sidebar Categories -->
      <aside class="advice-categories-list">
        ${categories.map(cat => `
          <div class="advice-cat-item ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
            <span>${cat}</span>
          </div>
        `).join('')}
      </aside>

      <!-- Right main forum area -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Post Advice Form -->
        <div class="card" style="padding: 1.5rem;">
          <h4 class="font-semibold text-sm mb-3">Ask an Anonymous Question</h4>
          <form id="post-advice-form" onsubmit="return false;">
            <div class="form-group">
              <input type="text" id="advice-title" placeholder="What is your question? (e.g. Navigating procurement workflow)" class="form-input" required>
            </div>
            <div class="form-group">
              <textarea id="advice-body" placeholder="Describe your situation. Keep it detailed so peers can offer specific suggestions..." class="form-input" style="height: 80px; resize: none;" required></textarea>
            </div>
            <div class="d-flex justify-between align-center">
              <select class="form-input" id="advice-cat-select" style="width: auto; padding: 0.5rem 1rem;">
                <option value="First Year Survival">First Year Survival</option>
                <option value="Work Life & Balance">Work Life & Balance</option>
                <option value="Hybrid Work Tips">Hybrid Work Tips</option>
              </select>
              <label class="d-flex align-center gap-2 text-xs text-secondary cursor-pointer">
                <input type="checkbox" id="advice-anon-chk" checked style="accent-color: var(--indigo-primary)">
                <span>Post Anonymously</span>
              </label>
              <button type="submit" class="btn btn-primary btn-sm" id="btn-post-advice">Publish Question</button>
            </div>
          </form>
        </div>

        <!-- Threads list -->
        <div class="advice-thread-list" id="threads-list-box">
          <!-- Injected dynamically -->
        </div>
      </div>
    </div>
  `;

  // Bind category filters
  const catItems = targetNode.querySelectorAll('.advice-cat-item');
  catItems.forEach(item => item.addEventListener('click', (e) => {
    activeCategory = e.currentTarget.dataset.cat;
    catItems.forEach(i => i.classList.remove('active'));
    e.currentTarget.classList.add('active');
    filterAndRenderThreads();
  }));

  // Bind submit Question
  const publishForm = document.getElementById('post-advice-form');
  publishForm.addEventListener('submit', () => {
    const title = document.getElementById('advice-title').value.trim();
    const body = document.getElementById('advice-body').value.trim();
    const category = document.getElementById('advice-cat-select').value;
    const isAnon = document.getElementById('advice-anon-chk').checked;

    state.adviceThreads.unshift({
      id: state.adviceThreads.length + 1,
      category,
      title,
      body,
      author: isAnon ? "Anonymous Colleague" : state.user.name,
      timestamp: "Just now",
      likes: 0,
      replies: []
    });

    document.getElementById('advice-title').value = "";
    document.getElementById('advice-body').value = "";
    showToast("Question posted anonymously! Peers have been notified.");
    filterAndRenderThreads();
  });

  // Initial draw
  filterAndRenderThreads();
}

function renderMarketplace(targetNode) {
  let filterType = "all"; // all, offer, request

  function filterAndRenderItems() {
    let itemsHTML = "";
    let filtered = state.marketplaceItems;
    
    if (filterType !== "all") {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (filtered.length === 0) {
      itemsHTML = `<div style="grid-column: span 3; text-align: center; padding: 3rem; color: var(--text-muted)">No marketplace items listed yet.</div>`;
    } else {
      itemsHTML = filtered.map(item => createMarketplaceCardHTML(item)).join('');
    }

    const grid = document.getElementById('marketplace-items-grid');
    if (grid) {
      grid.innerHTML = itemsHTML;
      if (window.lucide) window.lucide.createIcons();
      
      // Bind Handshake/Connect buttons
      const connectBtns = grid.querySelectorAll('.offer-help-btn');
      connectBtns.forEach(btn => btn.addEventListener('click', (e) => {
        const title = e.currentTarget.dataset.title;
        const author = e.currentTarget.dataset.author;
        showToast(`Request to connect on "${title}" sent to ${author}! Check chat.`);
      }));
    }
  }

  targetNode.innerHTML = `
    <!-- Top Filter Bar & Create Btn -->
    <div class="d-flex justify-between align-center mb-6" style="margin-bottom: 1.5rem">
      <div class="d-flex gap-2">
        <button class="btn btn-outline btn-sm filter-m-btn active" data-type="all">All Ads</button>
        <button class="btn btn-outline btn-sm filter-m-btn" data-type="request">Need Help</button>
        <button class="btn btn-outline btn-sm filter-m-btn" data-type="offer">Offering Help</button>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-create-m-ad">Post an Ad</button>
    </div>

    <!-- Ad grid -->
    <div class="marketplace-grid" id="marketplace-items-grid">
      <!-- Injected dynamically -->
    </div>
  `;

  // Bind filters
  const filterBtns = targetNode.querySelectorAll('.filter-m-btn');
  filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
    filterType = e.currentTarget.dataset.type;
    filterBtns.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    filterAndRenderItems();
  }));

  // Bind Create modal
  const createBtn = document.getElementById('btn-create-m-ad');
  createBtn.addEventListener('click', () => {
    showModal(`
      <h3 class="view-title mb-4" style="font-size: 1.5rem; margin-bottom: 1rem">Post a Marketplace Ad</h3>
      <form id="create-ad-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Ad Type</label>
          <select class="form-input" id="ad-type">
            <option value="request">I Need Help (Request)</option>
            <option value="offer">I'm Offering Help / Sharing (Offer)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ad Title</label>
          <input type="text" id="ad-title" placeholder="Looking for a badminton partner" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="ad-desc" placeholder="Detail your request. Include schedule, logistics, or details." class="form-input" style="height: 100px; resize:none" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary w-full mt-4">Publish Ad</button>
      </form>
    `);

    // Handle submit inside modal
    const adForm = document.getElementById('create-ad-form');
    adForm.addEventListener('submit', () => {
      const type = document.getElementById('ad-type').value;
      const title = document.getElementById('ad-title').value.trim();
      const description = document.getElementById('ad-desc').value.trim();

      state.marketplaceItems.unshift({
        id: state.marketplaceItems.length + 1,
        type,
        title,
        description,
        author: state.user.name,
        department: state.user.department,
        timestamp: "Just now"
      });

      hideModal();
      showToast("Marketplace ad successfully published! Teammates have been notified.");
      filterAndRenderItems(); // Refresh board
    });
  });

  // Initial draw
  filterAndRenderItems();
}

// 7. EVENTS & RSVP
function renderEvents() {
  const container = document.getElementById('view-events');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Events";
  UI.viewSubtitle.textContent = "Discover coffee matches, workshops, and sports meetups. Meet up in person!";

  function drawEventList() {
    const list = document.getElementById('events-main-list');
    list.innerHTML = state.events.map(event => {
      const isRsvped = state.user.rsvpedEvents.includes(event.id);
      
      // Calculate initials of RSVPs
      const avatarHTML = event.rsvps.slice(0, 3).map(name => {
        const initials = name.split(' ').map(n=>n[0]).join('');
        return `<div class="avatar" title="${name}">${initials}</div>`;
      }).join('');

      return `
        <div class="card event-row-card">
          <div class="event-date-block">
            <span class="event-date-month">${event.date.month}</span>
            <span class="event-date-day">${event.date.day}</span>
          </div>
          <div class="event-info-block">
            <h3>${event.title}</h3>
            <p class="text-xs text-secondary mb-3" style="line-height: 1.4; margin-bottom: 0.5rem;">${event.description}</p>
            <div class="event-meta-items">
              <div class="event-meta-item"><i data-lucide="clock"></i><span>${event.time}</span></div>
              <div class="event-meta-item"><i data-lucide="map-pin"></i><span>${event.location}</span></div>
              <div class="event-meta-item"><i data-lucide="tag"></i><span>${event.type}</span></div>
            </div>
          </div>
          <div class="event-rsvps-block">
            <div class="rsvped-avatars mb-2" style="margin-bottom: 0.5rem">
              ${avatarHTML}
              ${event.rsvps.length > 3 ? `<div class="avatar" style="background-color: var(--border-color); font-size: 0.65rem">+${event.rsvps.length - 3}</div>` : ''}
            </div>
            <button class="btn ${isRsvped ? 'btn-outline' : 'btn-primary'} btn-sm w-full rsvp-toggle-btn" data-id="${event.id}">
              ${isRsvped ? 'Going' : 'RSVP Going'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // RSVP click listeners
    const rsvpBtns = list.querySelectorAll('.rsvp-toggle-btn');
    rsvpBtns.forEach(btn => btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const event = state.events.find(ev => ev.id === id);
      const rsvpIndex = state.user.rsvpedEvents.indexOf(id);

      if (rsvpIndex > -1) {
        state.user.rsvpedEvents.splice(rsvpIndex, 1);
        event.rsvps = event.rsvps.filter(name => name !== state.user.name);
        showToast(`Cancelled RSVP to ${event.title}`);
      } else {
        state.user.rsvpedEvents.push(id);
        event.rsvps.push(state.user.name);
        showToast(`RSVP'd successfully for ${event.title}! Added to calendar.`);
      }

      drawEventList(); // Refresh list
    }));
  }

  container.innerHTML = `
    <div class="events-layout">
      <!-- Main Lists -->
      <div class="events-main">
        <div class="d-flex justify-between align-center mb-4" style="margin-bottom: 1rem">
          <h2 class="font-semibold text-md">Upcoming Activities</h2>
          <button class="btn btn-primary btn-sm" id="btn-create-event">Create Activity</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem" id="events-main-list">
          <!-- Injected dynamically -->
        </div>
      </div>

      <!-- Right Calendar Preview -->
      <div class="card" style="align-self: start">
        <h3 class="card-title mb-4" style="margin-bottom: 1.25rem">Activity Calendar</h3>
        <div style="text-align: center;">
          <!-- Mini static calendar mock for design style -->
          <div class="d-flex justify-between mb-4" style="margin-bottom: 1rem; font-weight: 600; font-size: 0.85rem">
            <span>June 2026</span>
            <span class="text-muted"><i data-lucide="chevron-left" class="inline"></i> <i data-lucide="chevron-right" class="inline"></i></span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; font-size: 0.75rem; font-weight: 500">
            <span class="text-muted">S</span><span class="text-muted">M</span><span class="text-muted">T</span><span class="text-muted">W</span><span class="text-muted">T</span><span class="text-muted">F</span><span class="text-muted">S</span>
            <span>31</span><span>1</span><span>2</span><span>3</span><span>4</span><span class="badge badge-indigo" style="padding: 0.2rem; border-radius: 50%; width: 22px; height: 22px">5</span><span>6</span>
            <span>7</span><span>8</span><span class="badge badge-indigo" style="padding: 0.2rem; border-radius: 50%; width: 22px; height: 22px">9</span><span>10</span><span>11</span><span class="badge badge-indigo" style="padding: 0.2rem; border-radius: 50%; width: 22px; height: 22px">12</span><span>13</span>
            <span>14</span><span>15</span><span>16</span><span class="badge badge-indigo" style="padding: 0.2rem; border-radius: 50%; width: 22px; height: 22px">17</span><span>18</span><span>19</span><span>20</span>
          </div>
          <div class="text-xs text-muted mt-4 text-left" style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem">
            <i data-lucide="info" class="text-xs inline"></i> Highlights indicate days containing activities you are attending.
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind custom event creator
  const createEventBtn = document.getElementById('btn-create-event');
  createEventBtn.addEventListener('click', () => {
    showModal(`
      <h3 class="view-title mb-4" style="font-size: 1.5rem; margin-bottom: 1rem">Create a Workplace Activity</h3>
      <form id="create-event-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Activity Title</label>
          <input type="text" id="ev-title" placeholder="Lunch meetup at Chipotle" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Activity Type</label>
          <select class="form-input" id="ev-type">
            <option value="Lunch Meetup">Lunch Meetup</option>
            <option value="Sports Activity">Sports Activity</option>
            <option value="Coffee Chat">Coffee Chat</option>
            <option value="Workshop">Skills Workshop</option>
          </select>
        </div>
        <div class="form-group d-flex gap-2" style="flex-direction: row; margin-bottom: 0px">
          <div class="form-group flex-grow">
            <label class="form-label">Day (1-30)</label>
            <input type="number" id="ev-day" min="1" max="30" value="15" class="form-input" required>
          </div>
          <div class="form-group flex-grow">
            <label class="form-label">Time</label>
            <input type="text" id="ev-time" placeholder="12:30 PM - 1:30 PM" class="form-input" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" id="ev-loc" placeholder="Meet at office reception" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="ev-desc" placeholder="Describe the plan, what to bring, etc." class="form-input" style="height: 60px; resize:none" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary w-full mt-4">Publish Activity</button>
      </form>
    `);

    const evForm = document.getElementById('create-event-form');
    evForm.addEventListener('submit', () => {
      const title = document.getElementById('ev-title').value.trim();
      const type = document.getElementById('ev-type').value;
      const day = parseInt(document.getElementById('ev-day').value);
      const time = document.getElementById('ev-time').value.trim();
      const location = document.getElementById('ev-loc').value.trim();
      const description = document.getElementById('ev-desc').value.trim();

      const dayStr = day < 10 ? `0${day}` : `${day}`;

      state.events.unshift({
        id: state.events.length + 100,
        title,
        type,
        date: { month: "Jun", day: dayStr, weekday: "Weekday" },
        time,
        location,
        rsvps: [state.user.name],
        description
      });

      // Add to user's RSVPs instantly
      state.user.rsvpedEvents.push(state.events[0].id);

      hideModal();
      showToast("Activity successfully created! Calendar invitations sent.");
      drawEventList();
    });
  });

  drawEventList();
}

// 7. MENTORSHIP & BUDDY HUB (New Hire Accelerator)
function renderMentorship() {
  const container = document.getElementById('view-mentorship');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Accelerator";
  UI.viewSubtitle.textContent = "Time-based onboarding pathways and AI-guided career pairings.";

  // Find recommended mentors: Match users' skillsToLearn with employee skills
  const mentorCandidates = employees.filter(emp => 
    emp.skills.some(skill => state.user.skillsToLearn.includes(skill))
  );

  container.innerHTML = `
    <!-- Onboarding Accelerator Pipeline -->
    <div class="card mb-6" style="margin-bottom: 2rem">
      <div class="card-header">
        <div>
          <span class="badge badge-success font-semibold mb-1" style="margin-bottom: 0.25rem;">New Hire Accelerator Track</span>
          <h3 class="card-title">Your 30-Day Integration Roadmap</h3>
        </div>
      </div>
      
      <div class="accelerator-timeline">
        <div class="accelerator-step-node completed">
          <div class="accelerator-step-circle">1</div>
          <span class="accelerator-step-day">Day 1</span>
          <span class="accelerator-step-title">Assign Buddy</span>
        </div>
        <div class="accelerator-step-node completed">
          <div class="accelerator-step-circle">3</div>
          <span class="accelerator-step-day">Day 3</span>
          <span class="accelerator-step-title">Coffee Match</span>
        </div>
        <div class="accelerator-step-node active">
          <div class="accelerator-step-circle">7</div>
          <span class="accelerator-step-day">Day 7</span>
          <span class="accelerator-step-title">Join Communities</span>
        </div>
        <div class="accelerator-step-node">
          <div class="accelerator-step-circle">14</div>
          <span class="accelerator-step-day">Day 14</span>
          <span class="accelerator-step-title">First Event RSVP</span>
        </div>
        <div class="accelerator-step-node">
          <div class="accelerator-step-circle">30</div>
          <span class="accelerator-step-day">Day 30</span>
          <span class="accelerator-step-title">Integration Review</span>
        </div>
      </div>
      <p class="text-xs text-muted" style="text-align: center">
        Your next step: Join the Photography Circle or Gamer Hub communities to check off your Day 7 milestone.
      </p>
    </div>

    <!-- AI Mentors Suggestions -->
    <h2 class="font-semibold text-md mb-4" style="margin-bottom: 1rem">AI-Recommended Professional Mentors</h2>
    <div class="employee-grid" id="mentor-grid-box">
      <!-- Injected below -->
    </div>
  `;

  const mentorBox = document.getElementById('mentor-grid-box');
  if (mentorCandidates.length === 0) {
    mentorBox.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted)">No mentor profiles match your requested learning fields.</div>`;
  } else {
    mentorBox.innerHTML = mentorCandidates.map(emp => {
      const compScore = calculateCompatibility(state.user.personality, emp.personality);
      const matchingSkills = emp.skills.filter(s => state.user.skillsToLearn.includes(s));
      const initials = emp.name.split(' ').map(n=>n[0]).join('');
      
      return `
        <div class="card employee-card">
          <div class="employee-card-compatibility">
            <span class="badge badge-success font-semibold">${compScore}% Compatibility</span>
          </div>
          <div class="employee-card-avatar">${initials}</div>
          <h3 class="employee-info-title">${emp.name}</h3>
          <p class="employee-info-sub">${emp.role} &bull; ${emp.department}</p>
          
          <div class="text-xs text-secondary mb-4" style="margin-top: 1rem; margin-bottom: 1.25rem;">
            <div class="font-semibold text-primary" style="margin-bottom: 0.25rem">Can help you learn:</div>
            ${matchingSkills.map(s => `<span class="badge badge-indigo text-xs" style="margin-right: 0.25rem; margin-bottom: 0.25rem">${s}</span>`).join('')}
          </div>
          
          <button class="btn btn-primary btn-sm w-full request-mentorship-btn" data-name="${emp.name}">
            Request Mentorship Pair
          </button>
        </div>
      `;
    }).join('');

    // Bind mentorship request action
    const reqBtns = mentorBox.querySelectorAll('.request-mentorship-btn');
    reqBtns.forEach(btn => btn.addEventListener('click', (e) => {
      const name = e.currentTarget.dataset.name;
      showToast(`Mentorship request sent to ${name}! HR department will review alignment.`);
    }));
  }

  if (window.lucide) window.lucide.createIcons();
}

// 8. HR ANALYTICS & OUTCOMES (Business Metrics & Workplace Relationship Graph™)
function renderHRAnalytics() {
  const container = document.getElementById('view-analytics');
  container.classList.remove('hidden');
  
  UI.viewTitle.textContent = "Connection Health Analytics";
  UI.viewSubtitle.textContent = "Track employee connection health, alignment speed, and isolation risk indicators.";

  // Render Shell
  container.innerHTML = `
    <!-- Top-level Business Outcome Metrics -->
    <div class="analytics-summary-cards">
      <div class="card analytics-summary-card">
        <span class="text-xs text-muted font-semibold">EMPLOYEE BELONGING</span>
        <div class="analytics-stat-val mt-1">${hrAnalytics.outcomes.belongingScore}/100</div>
        <span class="analytics-stat-change change-up">${hrAnalytics.outcomes.belongingScoreTrend}</span>
      </div>
      <div class="card analytics-summary-card">
        <span class="text-xs text-muted font-semibold">INTEGRATION SPEED</span>
        <div class="analytics-stat-val mt-1">${hrAnalytics.outcomes.integrationSpeedDays} Days</div>
        <span class="analytics-stat-change change-up">${hrAnalytics.outcomes.integrationSpeedTrend}</span>
      </div>
      <div class="card analytics-summary-card">
        <span class="text-xs text-muted font-semibold">MENTOR ENGAGEMENT</span>
        <div class="analytics-stat-val mt-1">${hrAnalytics.outcomes.mentorshipEngagement}%</div>
        <span class="analytics-stat-change change-up">${hrAnalytics.outcomes.mentorshipEngagementTrend}</span>
      </div>
      <div class="card analytics-summary-card">
        <span class="text-xs text-muted font-semibold">CROSS-TEAM BRIDGES</span>
        <div class="analytics-stat-val mt-1">${hrAnalytics.outcomes.crossFunctionalConnections}</div>
        <span class="analytics-stat-change change-up">${hrAnalytics.outcomes.crossFunctionalTrend}</span>
      </div>
      <div class="card analytics-summary-card" style="border-left: 4px solid var(--color-error)">
        <span class="text-xs text-muted font-semibold">RETENTION RISK</span>
        <div class="analytics-stat-val mt-1">${hrAnalytics.outcomes.retentionRiskFlags} Flag</div>
        <span class="analytics-stat-change change-down">Sales Dept isolated</span>
      </div>
    </div>

    <!-- Charts row -->
    <div class="analytics-chart-row">
      <!-- Connection Health by department (Loneliness scores) -->
      <div class="card analytics-chart-card">
        <h3 class="card-title mb-4">Department Connection Health Scores</h3>
        <div class="chart-body-wrapper">
          <div class="connection-health-bar-row">
            ${hrAnalytics.teamHealth.map(item => {
              // Set color based on score threshold
              let fillClass = "fill-high";
              if (item.score < 80) fillClass = "fill-mid";
              if (item.score < 60) fillClass = "fill-low";
              
              return `
                <div class="health-bar-item">
                  <div class="health-bar-header">
                    <span>${item.team} (${item.members} members)</span>
                    <span class="font-semibold">${item.score}/100</span>
                  </div>
                  <div class="health-bar-track">
                    <div class="health-bar-fill ${fillClass}" style="width: ${item.score}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Growth trends line chart -->
      <div class="card analytics-chart-card">
        <h3 class="card-title mb-2">Cross-Functional Growth Trend</h3>
        <p class="text-xs text-muted mb-4" style="margin-bottom: 1rem">Total cumulative trust connections bridged inside corporate environments.</p>
        <div class="chart-body-wrapper">
          ${createSVGLineChartHTML(hrAnalytics.connectionGrowthData)}
        </div>
      </div>
    </div>

    <!-- Workplace Relationship Graph™ -->
    <div class="card relationship-graph-container">
      <div class="card-header">
        <div>
          <span class="badge badge-indigo text-xs mb-1" style="margin-bottom: 0.25rem;">Proprietary Technology</span>
          <h3 class="card-title">Workplace Relationship Graph™</h3>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted)">
          Hover nodes to trace connection layers. Active buddy ties are highlighted in Indigo.
        </div>
      </div>
      
      <div class="graph-canvas-wrapper" id="graph-canvas-box">
        ${createRelationshipGraphSVG(hrAnalytics.graph)}
        <div class="graph-tooltip hidden" id="graph-node-tooltip"></div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Interactivity for Workplace Relationship Graph™
  const nodes = container.querySelectorAll('.graph-node-group');
  const edges = container.querySelectorAll('.graph-edge');
  const tooltip = document.getElementById('graph-node-tooltip');

  nodes.forEach(nodeGroup => {
    nodeGroup.addEventListener('mouseenter', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const name = e.currentTarget.dataset.name;
      const role = e.currentTarget.dataset.role;
      const dept = e.currentTarget.dataset.dept;

      // Draw tooltip
      const circle = e.currentTarget.querySelector('circle');
      const rect = circle.getBoundingClientRect();
      const parentRect = document.getElementById('graph-canvas-box').getBoundingClientRect();

      tooltip.innerHTML = `
        <strong>${name}</strong><br>
        <span class="text-muted">${role} &bull; ${dept}</span>
      `;
      tooltip.style.left = `${rect.left - parentRect.left + 15}px`;
      tooltip.style.top = `${rect.top - parentRect.top - 15}px`;
      tooltip.classList.remove('hidden');

      // Highlight links associated with this node
      edges.forEach(edge => {
        const src = parseInt(edge.dataset.source);
        const tgt = parseInt(edge.dataset.target);
        if (src === id || tgt === id) {
          edge.classList.add('active');
          edge.style.strokeWidth = "4px";
        } else {
          edge.style.opacity = "0.1";
        }
      });
    });

    nodeGroup.addEventListener('mouseleave', () => {
      tooltip.classList.add('hidden');
      edges.forEach(edge => {
        edge.classList.remove('active');
        edge.style.strokeWidth = "";
        edge.style.opacity = "";
      });
    });
  });
}
