/* ==========================================================================
   KINSHIP DATA MODULE & STATE STORAGE
   ========================================================================== */

// 1. Initial Default Session State
export const state = {
  // Active User Profile (Will be filled by onboarding)
  user: {
    name: "Alex Mercer",
    role: "Junior Product Designer",
    department: "Product",
    location: "Hybrid NYC",
    interests: ["Photography", "Gaming", "Travel"],
    skills: ["UI/UX Design", "Prototyping", "Figma"],
    skillsToLearn: ["Product Strategy", "React", "Public Speaking"],
    personality: {
      introvertExtrovert: 35,       // Slider value: 0 is full Introvert, 100 is full Extrovert
      casualDeep: 75,               // 0 is casual chats, 100 is deep conversations
      structuredSpontaneous: 40,    // 0 is structured, 100 is spontaneous
      morningEvening: 45,           // 0 is morning, 100 is evening
      careerHobby: 50               // 0 is career-focused, 100 is hobby-focused
    },
    buddyAssigned: "Sarah Jenkins",
    joinedCommunities: ["Photography Circle", "Gamer Hub"],
    rsvpedEvents: [101], // Pre-RSVP'd to Coffee Match
    scheduledChats: [],  // Scheduled coffee partners
    onboarded: false     // Set true after onboarding completes
  },
  
  // Custom advice board threads added by users
  adviceThreads: [],
  
  // Custom marketplace items added by users
  marketplaceItems: [],
  
  // Custom events created by users
  customEvents: []
};

// 2. Mock Employees Database (Equipped with personality scores to compute Human Compatibility Score™)
export const employees = [
  {
    id: 1,
    name: "Rahul Malhotra",
    role: "Senior Product Manager",
    department: "Product",
    location: "Hybrid NYC",
    tenure: "3 years",
    photoUrl: "RM",
    interests: ["Formula 1", "Photography", "Hiking", "Coffee"],
    skills: ["Product Strategy", "Roadmapping", "SQL"],
    skillsToLearn: ["Machine Learning", "Public Speaking"],
    personality: {
      introvertExtrovert: 80,
      casualDeep: 40,
      structuredSpontaneous: 70,
      morningEvening: 75,
      careerHobby: 60
    },
    influence: 15 // for graph node sizing
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Marketing Manager",
    department: "Marketing",
    location: "Hybrid SF",
    tenure: "2 years",
    photoUrl: "PS",
    interests: ["Books", "Fitness", "Travel", "Yoga"],
    skills: ["Brand Strategy", "Copywriting", "SEO"],
    skillsToLearn: ["Data Analytics", "Figma"],
    personality: {
      introvertExtrovert: 30,
      casualDeep: 85,
      structuredSpontaneous: 30,
      morningEvening: 30,
      careerHobby: 40
    },
    influence: 12
  },
  {
    id: 3,
    name: "Amit Patel",
    role: "Technical Service Lead",
    department: "Operations",
    location: "Hybrid London",
    tenure: "5 years",
    photoUrl: "AP",
    interests: ["Chess", "Running", "DIY Projects", "Photography"],
    skills: ["Technical Support", "Cross-team Comms", "Process Optimization"],
    skillsToLearn: ["Product Strategy", "Conflict Resolution"],
    personality: {
      introvertExtrovert: 45,
      casualDeep: 50,
      structuredSpontaneous: 80,
      morningEvening: 90,
      careerHobby: 80
    },
    influence: 18
  },
  {
    id: 4,
    name: "Sarah Jenkins",
    role: "Lead Product Designer",
    department: "Product",
    location: "Remote (Boston)",
    tenure: "4 years",
    photoUrl: "SJ",
    interests: ["Books", "Gaming", "Drawing", "Cooking"],
    skills: ["UI/UX Design", "Design Systems", "User Research"],
    skillsToLearn: ["3D Modeling", "Motion Design"],
    personality: {
      introvertExtrovert: 25,
      casualDeep: 90,
      structuredSpontaneous: 20,
      morningEvening: 40,
      careerHobby: 50
    },
    influence: 20
  },
  {
    id: 5,
    name: "David Kim",
    role: "Senior Software Engineer",
    department: "Engineering",
    location: "Hybrid SF",
    tenure: "1 year",
    photoUrl: "DK",
    interests: ["Gaming", "Music", "Coding", "Anime"],
    skills: ["React", "Node.js", "System Design"],
    skillsToLearn: ["UI/UX Design", "Technical Writing"],
    personality: {
      introvertExtrovert: 15,
      casualDeep: 95,
      structuredSpontaneous: 65,
      morningEvening: 20,
      careerHobby: 70
    },
    influence: 10
  },
  {
    id: 6,
    name: "Elena Rostova",
    role: "HR Generalist",
    department: "HR",
    location: "Hybrid NYC",
    tenure: "2 years",
    photoUrl: "ER",
    interests: ["Baking", "Travel", "Fitness", "Hiking"],
    skills: ["Conflict Resolution", "Onboarding", "Active Listening"],
    skillsToLearn: ["HR Analytics", "Public Speaking"],
    personality: {
      introvertExtrovert: 85,
      casualDeep: 45,
      structuredSpontaneous: 50,
      morningEvening: 80,
      careerHobby: 65
    },
    influence: 16
  },
  {
    id: 7,
    name: "Marcus Aurelius",
    role: "Customer Success Director",
    department: "Sales",
    location: "Hybrid London",
    tenure: "6 months",
    photoUrl: "MA",
    interests: ["Philosophy", "Books", "Coffee", "Chess"],
    skills: ["Client Relations", "Negotiation", "Public Speaking"],
    skillsToLearn: ["SQL", "Figma"],
    personality: {
      introvertExtrovert: 50,
      casualDeep: 95,
      structuredSpontaneous: 40,
      morningEvening: 60,
      careerHobby: 40
    },
    influence: 8
  },
  {
    id: 8,
    name: "Sophia Chen",
    role: "Account Executive",
    department: "Sales",
    location: "Hybrid Chicago",
    tenure: "1.5 years",
    photoUrl: "SC",
    interests: ["Running", "Travel", "Foodie", "Music"],
    skills: ["Sales Pitching", "B2B Negotiations", "Cold Outreach"],
    skillsToLearn: ["Product Roadmaps", "Data Analytics"],
    personality: {
      introvertExtrovert: 90,
      casualDeep: 35,
      structuredSpontaneous: 85,
      morningEvening: 70,
      careerHobby: 60
    },
    influence: 11
  }
];

// Helper function to calculate Human Compatibility Score™ between two personality profiles
export function calculateCompatibility(p1, p2) {
  // Simple Euclidean distance between the 5 personality parameters
  const keys = ['introvertExtrovert', 'casualDeep', 'structuredSpontaneous', 'morningEvening', 'careerHobby'];
  let sumSquaredDiffs = 0;
  
  keys.forEach(key => {
    const diff = p1[key] - p2[key];
    sumSquaredDiffs += diff * diff;
  });
  
  // Maximum theoretical distance is sqrt(5 * (100^2)) = sqrt(50000) = ~223.6
  const maxDistance = 223.6;
  const distance = Math.sqrt(sumSquaredDiffs);
  
  // Convert to percentage, where closer maps to higher score
  let percentage = Math.round((1 - (distance / maxDistance)) * 100);
  
  // Normalize score slightly so matches fall mostly between 50% and 98% (realistic)
  if (percentage < 50) percentage = 50 + Math.round((percentage / 50) * 15);
  if (percentage > 99) percentage = 99;
  
  return percentage;
}

// 3. Communities List (Focus: Real-world Event conversion, NO chat boards)
export const communities = [
  {
    id: 1,
    name: "Photography Circle",
    category: "Hobbies",
    members: 28,
    icon: "camera",
    description: "Capturing the beauty around us. All skill levels welcome, from iPhone creators to DSLR experts. Regular photo walks and gallery runs."
  },
  {
    id: 2,
    name: "Gamer Hub",
    category: "Gaming",
    members: 42,
    icon: "gamepad-2",
    description: "Co-op nights, friendly tournament matches, and general chat about console, PC, and board gaming. Organized local arcade meetups."
  },
  {
    id: 3,
    name: "Book Lovers Club",
    category: "Hobbies",
    members: 19,
    icon: "book-open",
    description: "A monthly gathering to discuss a collaborative book list spanning fiction, biographies, and workplace philosophies. No stress, just good talk."
  },
  {
    id: 4,
    name: "Fitness & Run Club",
    category: "Sports",
    members: 34,
    icon: "dumbbell",
    description: "Helping each other stay active. Weekly running groups (various paces), yoga meetups in the park, and weekend hiking expeditions."
  },
  {
    id: 5,
    name: "Travel Explorers",
    category: "Hobbies",
    members: 25,
    icon: "plane",
    description: "Share recommendations for weekend getaways, local hidden gems, and international holiday guides. Planning shared group hikes."
  },
  {
    id: 6,
    name: "Tech & AI Pioneers",
    category: "Professional",
    members: 51,
    icon: "cpu",
    description: "For curious minds studying AI developments, prompt engineering, side-projects, and tech trends. Focused on hands-on build workshops."
  }
];

// 4. Anonymous Advice Boards Data (To minimize onboarding fear)
export const initialAdviceThreads = [
  {
    id: 1,
    category: "First Year Survival",
    title: "Struggling to understand the procurement workflow. Help?",
    body: "Hey everyone! I'm in my second week and need to submit an order for design assets, but the internal system is incredibly confusing. Can anyone walk me through the approvals chain?",
    author: "Anonymous New Hire",
    timestamp: "2 hours ago",
    likes: 12,
    replies: [
      {
        author: "Elena Rostova (HR)",
        body: "Welcome to the team! The approvals system requires you to submit a ticket on 'Jira Service Desk' under Procurement before buying. Let's grab coffee on Thursday and I can live-share the screen to show you!",
        timestamp: "1 hour ago"
      },
      {
        author: "Anonymous Peer",
        body: "I struggled with this too! Make sure your manager approves it in writing first; procurement will reject it immediately if you don't attach the email PDF approval.",
        timestamp: "45 mins ago"
      }
    ]
  },
  {
    id: 2,
    category: "Work Life & Balance",
    title: "How do you set hybrid boundaries without looking uncommitted?",
    body: "I work hybrid (Tues-Thurs in office). I notice several team members staying in office until 7pm, but I have a commute and leave at 5:15 to write code from home. I'm worried it looks bad to my director. How do you handle this?",
    author: "Anonymous Engineer",
    timestamp: "1 day ago",
    likes: 24,
    replies: [
      {
        author: "Rahul Malhotra (Product)",
        body: "Speaking as a manager: I promise we care about results, not office seat time. If your deliverables are clear and green, you are good. Just make sure your Slack status reflects your hours so we know when you are reachable.",
        timestamp: "18 hours ago"
      }
    ]
  },
  {
    id: 3,
    category: "Hybrid Work Tips",
    title: "Best spots around the NYC HQ for a quiet coffee chat?",
    body: "Looking for recommendations. The lobby cafeteria is too loud for an actual conversation. Any quieter coffee shops nearby?",
    author: "Alex Mercer",
    timestamp: "2 days ago",
    likes: 8,
    replies: [
      {
        author: "Amit Patel (Operations)",
        body: "There is a lovely hidden garden coffee shop called 'The Green Bean' just two blocks east. It has high ceilings, is quiet, and the matcha is stellar.",
        timestamp: "2 days ago"
      }
    ]
  }
];

// 5. Employee Trust Marketplace ("Help & Share")
export const initialMarketplaceItems = [
  {
    id: 1,
    type: "request",
    title: "Looking for Badminton partner",
    description: "Looking for someone to play badminton with at the Brooklyn Sports Center on Wednesday evenings. I have spare racquets. Intermediate level preferred!",
    author: "David Kim",
    department: "Engineering",
    timestamp: "3 hours ago"
  },
  {
    id: 2,
    type: "request",
    title: "Need help moving a couch (Saturday)",
    description: "Moving apartments from Astoria to Long Island City. It's just a 3-seater couch. I have a rental van, just need an extra pair of hands. Beer and pizza on me!",
    author: "Sophia Chen",
    department: "Sales",
    timestamp: "1 day ago"
  },
  {
    id: 3,
    type: "offer",
    title: "Offering carpool to NYC office from Jersey City",
    description: "Drive into the Hudson Yards office every Tuesday and Thursday morning (leaving JC at 7:45 AM). Happy to take 2-3 passengers to share the commute conversation!",
    author: "Elena Rostova",
    department: "HR",
    timestamp: "2 days ago"
  },
  {
    id: 4,
    type: "offer",
    title: "Free vintage bicycle for new hire",
    description: "I have an old but fully functional 10-speed road bike sitting in my basement. It's a size Medium. Yours for free if you can pick it up from Brooklyn!",
    author: "Amit Patel",
    department: "Operations",
    timestamp: "3 days ago"
  }
];

// 6. Platform Calendar Events
export const initialEvents = [
  {
    id: 101,
    title: "Weekly Coffee Match",
    type: "Coffee Chat",
    date: { month: "Jun", day: "05", weekday: "Friday" },
    time: "10:00 AM - 10:30 AM",
    location: "Virtual or Local Coffee Spot",
    rsvps: ["Alex Mercer", "Rahul Malhotra", "Priya Sharma", "David Kim"],
    description: "Our automated matching event. Sit down with a co-worker outside your direct team, backed by the Human Compatibility Score™."
  },
  {
    id: 102,
    title: "Photography Photo Walk - High Line",
    type: "Meetup",
    date: { month: "Jun", day: "09", weekday: "Tuesday" },
    time: "5:30 PM - 7:00 PM",
    location: "Meet at Chelsea market entrance",
    rsvps: ["Rahul Malhotra", "Alex Mercer", "Amit Patel"],
    description: "Bring your camera (or phone!) and join the Photography Circle for a golden hour stroll across the High Line park. Pizza afterwards."
  },
  {
    id: 103,
    title: "Board Game Arena Showdown",
    type: "Gaming",
    date: { month: "Jun", day: "12", weekday: "Friday" },
    time: "6:00 PM - 9:00 PM",
    location: "HQ Cafeteria Annex",
    rsvps: ["David Kim", "Sarah Jenkins", "Marcus Aurelius"],
    description: "Catan, Ticket to Ride, and social deduction games. We supply the games and snacks; just bring your competitive spirit!"
  },
  {
    id: 104,
    title: "Introduction to Figma Design Systems",
    type: "Workshop",
    date: { month: "Jun", day: "17", weekday: "Wednesday" },
    time: "12:00 PM - 1:00 PM",
    location: "Meeting Room 4B / Zoom",
    rsvps: ["Sarah Jenkins", "Alex Mercer", "Sophia Chen", "Elena Rostova"],
    description: "Learn how we build components, styles, and token sets. Great for engineers who want to code designers' specs better."
  }
];

// 7. HR Analytics & Business Outcomes State
export const hrAnalytics = {
  // Top level outcomes
  outcomes: {
    belongingScore: 89, // out of 100
    belongingScoreTrend: "+4% MoM",
    integrationSpeedDays: 12.4, // average days to first cross-functional connection
    integrationSpeedTrend: "-52% vs last year (26 days)",
    mentorshipEngagement: 76, // % active pairs
    mentorshipEngagementTrend: "+12% MoM",
    crossFunctionalConnections: 1480, // count
    crossFunctionalTrend: "+28% QoQ",
    retentionRiskFlags: 1 // Count of teams under attention
  },
  
  // Connection Health Score by Team (Loneliness scores)
  teamHealth: [
    { team: "Product & Design", score: 85, activeChats: 48, members: 16 },
    { team: "Engineering", score: 82, activeChats: 92, members: 34 },
    { team: "Marketing & Comms", score: 78, activeChats: 22, members: 10 },
    { team: "Operations", score: 68, activeChats: 18, members: 12 },
    { team: "Sales & Accounts", score: 54, activeChats: 12, members: 18 } // Risk flag team
  ],
  
  // Connection growth over time (X, Y coords for SVG graph)
  connectionGrowthData: [
    { month: "Jan", connections: 400 },
    { month: "Feb", connections: 620 },
    { month: "Mar", connections: 790 },
    { month: "Apr", connections: 1050 },
    { month: "May", connections: 1480 }
  ],
  
  // Workplace Relationship Graph™ nodes and links layout
  graph: {
    nodes: [
      { id: 1, name: "Sarah Jenkins", role: "Design Lead", dept: "Product", size: 14, x: 200, y: 150 },
      { id: 2, name: "David Kim", role: "Senior Engineer", dept: "Engineering", size: 8, x: 120, y: 220 },
      { id: 3, name: "Amit Patel", role: "Ops Lead", dept: "Operations", size: 12, x: 280, y: 260 },
      { id: 4, name: "Rahul Malhotra", role: "Senior PM", dept: "Product", size: 11, x: 180, y: 280 },
      { id: 5, name: "Priya Sharma", role: "Marketing Mgr", dept: "Marketing", size: 9, x: 340, y: 180 },
      { id: 6, name: "Elena Rostova", role: "HR Lead", dept: "HR", size: 13, x: 250, y: 80 },
      { id: 7, name: "Marcus Aurelius", role: "CS Director", dept: "Sales", size: 6, x: 380, y: 100 },
      { id: 8, name: "Alex Mercer (You)", role: "Designer", dept: "Product", size: 10, x: 100, y: 100 }
    ],
    links: [
      { source: 1, target: 8, type: "buddy" },        // Sarah is Alex's buddy
      { source: 1, target: 4, type: "colleague" },    // Sarah and Rahul
      { source: 4, target: 8, type: "coffee" },       // Rahul and Alex
      { source: 4, target: 2, type: "colleague" },    // Rahul and David
      { source: 2, target: 3, type: "coffee" },       // David and Amit
      { source: 3, target: 5, type: "colleague" },    // Amit and Priya
      { source: 5, target: 7, type: "coffee" },       // Priya and Marcus
      { source: 6, target: 1, type: "mentorship" },   // Elena mentors Sarah
      { source: 6, target: 3, type: "colleague" },    // Elena and Amit
      { source: 6, target: 8, type: "coffee" },       // Elena and Alex
      { source: 5, target: 1, type: "coffee" }        // Priya and Sarah
    ]
  }
};
