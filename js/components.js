/* ==========================================================================
   KINSHIP COMPONENT GENERATORS (Dynamic DOM Creators)
   ========================================================================= */

import { calculateCompatibility } from './data.js';

// 1. Generate Personality Slider Axis HTML
export function createPersonalitySlidersHTML(personalityState) {
  const axes = [
    { key: "introvertExtrovert", left: "Introvert", right: "Extrovert" },
    { key: "casualDeep", left: "Casual Chats", right: "Deep Conversations" },
    { key: "structuredSpontaneous", left: "Structured", right: "Spontaneous" },
    { key: "morningEvening", left: "Morning Person", right: "Evening Person" },
    { key: "careerHobby", left: "Career Focus", right: "Hobby Focus" }
  ];

  return axes.map(axis => `
    <div class="slider-group">
      <div class="slider-labels">
        <span>${axis.left}</span>
        <span>${axis.right}</span>
      </div>
      <div class="slider-wrapper">
        <input 
          type="range" 
          min="1" 
          max="100" 
          value="${personalityState[axis.key]}" 
          class="personality-slider" 
          data-key="${axis.key}"
          id="slider-${axis.key}"
        >
      </div>
    </div>
  `).join('');
}

// 2. Generate Employee Compatibility Card
export function createEmployeeCardHTML(employee, currentUser) {
  const compScore = calculateCompatibility(currentUser.personality, employee.personality);
  
  // Choose badge color based on compatibility
  let badgeClass = "badge-success";
  if (compScore < 85) badgeClass = "badge-indigo";
  if (compScore < 70) badgeClass = "badge-warning";
  
  // Build mutual items
  const mutualInterests = employee.interests.filter(i => currentUser.interests.includes(i));
  const sharedDept = employee.department === currentUser.department;
  const commonTrait = getSharedPersonalityTrait(currentUser.personality, employee.personality);
  
  // Avatar fallback initials
  const initials = employee.name.split(' ').map(n => n[0]).join('');
  
  // Format mutual interests text
  let mutualText = "";
  if (mutualInterests.length > 0) {
    mutualText = `<span><i data-lucide="heart" class="text-xs inline"></i> Mutual: ${mutualInterests.slice(0, 2).join(', ')}</span>`;
  } else {
    mutualText = `<span><i data-lucide="map-pin" class="text-xs inline"></i> ${employee.location}</span>`;
  }

  return `
    <div class="card employee-card" data-employee-id="${employee.id}">
      <div class="employee-card-compatibility">
        <span class="badge ${badgeClass} font-semibold">${compScore}% Match</span>
      </div>
      
      <div class="employee-card-avatar">${initials}</div>
      
      <h3 class="employee-info-title">${employee.name}</h3>
      <p class="employee-info-sub">${employee.role} &bull; ${employee.department}</p>
      
      <div class="employee-card-chips">
        ${employee.interests.slice(0, 3).map(interest => `
          <span class="chip active">${interest}</span>
        `).join('')}
      </div>

      <div class="text-xs text-secondary d-flex flex-direction-column gap-1 mb-4" style="flex-direction: column; margin-bottom: 1.25rem;">
        ${mutualText}
        <span class="text-muted"><i data-lucide="sparkles" class="text-xs inline"></i> ${commonTrait}</span>
      </div>
      
      <div class="employee-card-actions">
        <button class="btn btn-primary btn-sm flex-grow book-coffee-btn" data-id="${employee.id}">Book Coffee</button>
        <button class="btn btn-outline btn-sm btn-icon icebreaker-trigger-btn" data-id="${employee.id}" title="Get AI Icebreaker">
          <i data-lucide="message-square"></i>
        </button>
      </div>
    </div>
  `;
}

// Helper to determine personality traits
function getSharedPersonalityTrait(p1, p2) {
  const traits = [];
  if (p1.introvertExtrovert < 40 && p2.introvertExtrovert < 40) traits.push("Fellow introverts");
  if (p1.introvertExtrovert > 60 && p2.introvertExtrovert > 60) traits.push("Social extroverts");
  if (p1.casualDeep > 60 && p2.casualDeep > 60) traits.push("Love deep talks");
  if (p1.morningEvening < 40 && p2.morningEvening < 40) traits.push("Both morning birds");
  if (p1.morningEvening > 60 && p2.morningEvening > 60) traits.push("Both night owls");
  if (p1.structuredSpontaneous > 60 && p2.structuredSpontaneous > 60) traits.push("Spontaneous spirits");
  if (p1.careerHobby > 60 && p2.careerHobby > 60) traits.push("Hobby collectors");
  
  if (traits.length > 0) return traits[0];
  return "Great balance of traits";
}

// 3. Generate AI Icebreaker Content
export function generateIcebreakerHTML(employee, currentUser) {
  const compScore = calculateCompatibility(currentUser.personality, employee.personality);
  
  // Pick icebreaker scenarios
  const mutualInterests = employee.interests.filter(i => currentUser.interests.includes(i));
  let icebreaker = "";

  if (mutualInterests.length > 0) {
    const interest = mutualInterests[0];
    if (interest === "Gaming") {
      icebreaker = `You both enjoy Gaming! Ask: "Hey ${employee.name.split(' ')[0]}! Kinship matched us as coffee partners. I noticed you play games too—are you working through any campaigns right now or mostly playing multiplayer?"`;
    } else if (interest === "Photography") {
      icebreaker = `You both love Photography! Ask: "Hi ${employee.name.split(' ')[0]}! We got matched for coffee. I saw you enjoy photography. Do you shoot film, digital, or mostly capture details on your phone? Would love to share some local spots!"`;
    } else if (interest === "Formula 1") {
      icebreaker = `You both enjoy Formula 1! Ask: "Hey ${employee.name.split(' ')[0]}! Great to match with you. F1 is a shared interest of ours—who do you think is going to pull off the podium finish this weekend?"`;
    } else {
      icebreaker = `You both enjoy ${interest}! Ask: "Hi ${employee.name.split(' ')[0]}! Kinship connected us today. I see we share an interest in ${interest}. How long have you been into it? Would love to chat about it over coffee."`;
    }
  } else {
    // Fall back to personality slider matching
    if (currentUser.personality.casualDeep > 60 && employee.personality.casualDeep > 60) {
      icebreaker = `You both enjoy deep conversations! Ask: "Hi ${employee.name.split(' ')[0]}! We matched for coffee. I love learning what people are passionate about outside of work. What's a project or hobby you've been putting time into lately?"`;
    } else {
      icebreaker = `You have complementary personality styles! Ask: "Hey ${employee.name.split(' ')[0]}! We got paired up on Kinship today. Since we work in different bubbles (${currentUser.department} & ${employee.department}), I'd love to grab 15 minutes to learn what your week looks like. Let me know if you are free for coffee!"`;
    }
  }

  return `
    <div class="text-center">
      <div class="compatibility-badge-pill mb-4" style="margin-bottom: 1.5rem;">
        <i data-lucide="sparkles" class="text-xs"></i> ${compScore}% Human Compatibility
      </div>
      <h3 class="view-title mb-2" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Your Icebreaker for ${employee.name.split(' ')[0]}</h3>
      <p class="text-secondary text-sm mb-6" style="margin-bottom: 1.5rem;">We computed this prompt based on your shared attributes to break the friction of messaging.</p>
      
      <div class="icebreaker-box text-left">
        <div class="icebreaker-title">
          <i data-lucide="cpu" class="text-xs"></i> AI Concierge Suggested
        </div>
        <div class="icebreaker-content" id="icebreaker-text-content">
          "${icebreaker}"
        </div>
      </div>
      
      <div class="d-flex gap-3 justify-between w-full mt-6" style="margin-top: 1.5rem;">
        <button class="btn btn-outline btn-sm flex-grow" id="btn-copy-icebreaker">
          <i data-lucide="copy"></i> Copy Text
        </button>
        <button class="btn btn-primary btn-sm flex-grow" id="btn-send-message-icebreaker" data-id="${employee.id}">
          <i data-lucide="send"></i> Send as Message
        </button>
      </div>
    </div>
  `;
}

// 4. Generate Journey Timeline HTML
export function createJourneyTimelineHTML(userState) {
  const milestones = [
    { day: "Day 1", title: "Joined the Workspace", key: "joined", done: true, desc: "Welcome to Soudal! Your WROS account was registered." },
    { day: "Day 3", title: "Assigned Buddy Meetup", key: "buddy", done: userState.onboarded, desc: `Paired with ${userState.buddyAssigned} for onboarding acceleration.` },
    { day: "Day 7", title: "Schedule First Coffee Chat", key: "coffee", done: userState.scheduledChats.length > 0, desc: "Bridge a gap by booking coffee with a recommended match." },
    { day: "Day 14", title: "Explore & Join a Community", key: "community", done: userState.joinedCommunities.length > 0, desc: "Connect over shared hobbies or professional topics." },
    { day: "Day 30", title: "Connection Review & Health Check", key: "review", done: false, desc: "Check alignment metrics with HR outcome analytics." }
  ];

  return `
    <div class="journey-timeline">
      ${milestones.map(m => {
        let statusClass = "";
        if (m.done) statusClass = "completed";
        else if (m.key === "coffee" && userState.onboarded && userState.scheduledChats.length === 0) statusClass = "active";
        else if (m.key === "buddy" && !userState.onboarded) statusClass = "active";
        
        return `
          <div class="timeline-node ${statusClass}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">${m.title}</div>
            <div class="timeline-desc">${m.day} &bull; ${m.desc}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 5. Generate Advice Board Thread Card HTML
export function createAdviceCardHTML(thread) {
  return `
    <div class="card advice-card" data-thread-id="${thread.id}">
      <div class="advice-card-header">
        <div class="advice-card-author">
          <i data-lucide="user"></i>
          <span>Posted by ${thread.author} &bull; ${thread.timestamp}</span>
        </div>
        <span class="badge badge-indigo">${thread.category}</span>
      </div>
      <h3 class="advice-card-title">${thread.title}</h3>
      <p class="advice-card-body">${thread.body}</p>
      
      <div class="d-flex align-center gap-4 text-xs text-secondary">
        <button class="btn btn-ghost btn-sm btn-icon text-secondary font-semibold btn-like-thread" data-id="${thread.id}" style="width: auto; height: auto; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="thumbs-up" style="width: 14px; height: 14px;"></i>
          <span>${thread.likes} Likes</span>
        </button>
        <span><i data-lucide="message-square" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i> ${thread.replies.length} Replies</span>
      </div>

      <div class="advice-replies-section">
        ${thread.replies.map(reply => `
          <div class="advice-reply-item">
            <div class="font-semibold text-xs mb-1" style="margin-bottom: 0.25rem; color: var(--text-primary);">${reply.author} <span class="text-muted font-normal">&bull; ${reply.timestamp}</span></div>
            <div>${reply.body}</div>
          </div>
        `).join('')}
        
        <div class="form-group w-full d-flex gap-2" style="flex-direction: row; margin-bottom: 0; margin-top: 0.5rem;">
          <input type="text" placeholder="Type a helpful reply..." class="form-input text-sm reply-input" data-id="${thread.id}">
          <button class="btn btn-primary btn-sm submit-reply-btn" data-id="${thread.id}">Reply</button>
        </div>
      </div>
    </div>
  `;
}

// 6. Generate Marketplace Card HTML
export function createMarketplaceCardHTML(item) {
  const typeLabel = item.type === "offer" ? "Offering Hand" : "Needs Help";
  const typeClass = item.type === "offer" ? "offer" : "request";
  
  return `
    <div class="card marketplace-card" data-item-id="${item.id}">
      <div class="marketplace-card-header">
        <span class="marketplace-tag ${typeClass}">${typeLabel}</span>
        <span class="text-muted text-xs">${item.timestamp}</span>
      </div>
      <h3 class="marketplace-card-title">${item.title}</h3>
      <p class="marketplace-card-desc">${item.description}</p>
      
      <div class="marketplace-card-footer">
        <div>
          <span class="font-semibold">${item.author}</span>
          <span class="text-muted"> in ${item.department}</span>
        </div>
        <button class="btn btn-secondary btn-sm offer-help-btn" data-author="${item.author}" data-title="${item.title}">
          <i data-lucide="handshake" style="width: 14px; height: 14px;"></i> Connect
        </button>
      </div>
    </div>
  `;
}

// 7. Generate HR Outcome Metrics SVG Line Chart (Monthly Connection Growth)
export function createSVGLineChartHTML(growthData) {
  const points = growthData.map((d, index) => {
    // Map Jan-May (5 months) to SVG width (400px), connections (400-1500) to height (200px)
    const x = 50 + index * 80;
    // Map values where 1500 is top (Y=30), 0 is bottom (Y=180)
    const y = 180 - ((d.connections - 300) / 1200) * 140;
    return { x, y, month: d.month, val: d.connections };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  
  return `
    <svg viewBox="0 0 450 220" class="line-chart-svg">
      <!-- Grid lines -->
      <line x1="50" y1="40" x2="370" y2="40" class="line-chart-grid" />
      <line x1="50" y1="110" x2="370" y2="110" class="line-chart-grid" />
      <line x1="50" y1="180" x2="370" y2="180" class="line-chart-grid" />
      
      <!-- Axis Labels Y -->
      <text x="15" y="45" font-size="10" fill="var(--text-muted)">1,500</text>
      <text x="15" y="115" font-size="10" fill="var(--text-muted)">900</text>
      <text x="15" y="185" font-size="10" fill="var(--text-muted)">300</text>
      
      <!-- Chart line path -->
      <path d="${pathD}" class="line-chart-path" />
      
      <!-- Data Points & Labels -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--indigo-primary)" stroke="var(--bg-card)" stroke-width="2" />
        <text x="${p.x - 10}" y="${p.y - 12}" font-size="9" font-weight="600" fill="var(--text-primary)">${p.val}</text>
        <text x="${p.x - 8}" y="202" font-size="10" font-weight="500" fill="var(--text-secondary)">${p.month}</text>
      `).join('')}
    </svg>
  `;
}

// 8. Generate Workplace Relationship Graph™ Canvas (Interactive SVG representation)
export function createRelationshipGraphSVG(graphData) {
  const { nodes, links } = graphData;
  
  // Render Links
  const linksHTML = links.map((link, index) => {
    const srcNode = nodes.find(n => n.id === link.source);
    const tgtNode = nodes.find(n => n.id === link.target);
    if (!srcNode || !tgtNode) return '';
    
    let strokeClass = "graph-edge";
    if (link.type === "buddy") strokeClass += " active"; // highlighted buddy connections
    
    return `<line 
              x1="${srcNode.x}" y1="${srcNode.y}" 
              x2="${tgtNode.x}" y2="${tgtNode.y}" 
              class="${strokeClass}" 
              id="edge-${index}"
              data-source="${srcNode.id}"
              data-target="${tgtNode.id}"
            />`;
  }).join('');

  // Render Nodes
  const nodesHTML = nodes.map(node => {
    // Set color based on department
    let fill = "var(--text-secondary)";
    if (node.dept === "Product") fill = "var(--indigo-primary)";
    else if (node.dept === "Engineering") fill = "var(--color-info)";
    else if (node.dept === "HR") fill = "var(--color-success)";
    else if (node.dept === "Sales") fill = "var(--color-warning)";
    
    return `
      <g class="graph-node-group" data-id="${node.id}" data-name="${node.name}" data-role="${node.role}" data-dept="${node.dept}">
        <circle 
          cx="${node.x}" 
          cy="${node.y}" 
          r="${node.size}" 
          fill="${fill}" 
          class="graph-node"
          stroke="var(--bg-card)"
          stroke-width="2"
        />
        <text 
          x="${node.x}" 
          y="${node.y + node.size + 12}" 
          text-anchor="middle" 
          font-size="8" 
          font-weight="600" 
          fill="var(--text-primary)"
          style="pointer-events: none;"
        >${node.name.split(' ')[0]}</text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 450 350" class="graph-svg">
      <defs>
        <!-- Gradients if needed -->
      </defs>
      <!-- Draw links first so they are under nodes -->
      <g id="graph-links">${linksHTML}</g>
      <!-- Draw nodes -->
      <g id="graph-nodes">${nodesHTML}</g>
    </svg>
  `;
}
