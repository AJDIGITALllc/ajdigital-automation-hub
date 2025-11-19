/**
 * Cal.com Event Types Configuration
 * 
 * Single source of truth for all Cal.com booking types
 * Synced to Cal.com via automation job
 */

export interface CalEventTypeConfig {
  slug: string;
  title: string;
  description: string;
  lengthInMinutes: number;
  lengthInMinutesOptions?: number[];
  hidden?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Master list of all Cal.com event types
 * 
 * This config drives:
 * - Cal.com event type sync job
 * - Frontend booking embeds
 * - Module routing metadata
 */
export const CAL_EVENT_TYPES: CalEventTypeConfig[] = [
  // === Lead Generation & Discovery ===
  {
    slug: "discovery-call-15",
    title: "15-Min Discovery Call",
    description: "Fast-fit call to qualify and route you to the right system or offer.",
    lengthInMinutes: 15,
    metadata: {
      module: "marketing-automation",
      funnelStage: "top",
      segment: "lead",
    },
  },
  {
    slug: "consultation-30",
    title: "30-Min Strategy Consultation",
    description: "Deeper dive into your needs and how Audio Jones can help.",
    lengthInMinutes: 30,
    metadata: {
      module: "marketing-automation",
      funnelStage: "middle",
      segment: "qualified_lead",
    },
  },

  // === Client Onboarding ===
  {
    slug: "client-onboarding-audiojones",
    title: "Client Onboarding – Audio Jones",
    description: "Kickoff call to map your services, assets, and timelines.",
    lengthInMinutes: 60,
    metadata: {
      module: "client-delivery",
      segment: "consultant_smb",
      billingTier: "standard",
    },
  },
  {
    slug: "vip-onboarding",
    title: "VIP Client Onboarding",
    description: "Premium onboarding session with comprehensive setup and planning.",
    lengthInMinutes: 90,
    metadata: {
      module: "client-delivery",
      segment: "enterprise",
      billingTier: "vip",
    },
  },

  // === Project Delivery ===
  {
    slug: "project-kickoff",
    title: "Project Kickoff Meeting",
    description: "Initial project planning and requirements gathering session.",
    lengthInMinutes: 60,
    metadata: {
      module: "client-delivery",
      projectPhase: "initiation",
    },
  },
  {
    slug: "project-checkpoint",
    title: "Project Checkpoint",
    description: "Mid-project review and alignment session.",
    lengthInMinutes: 30,
    lengthInMinutesOptions: [30, 45, 60],
    metadata: {
      module: "client-delivery",
      projectPhase: "execution",
    },
  },
  {
    slug: "deliverable-review",
    title: "Deliverable Review",
    description: "Review and feedback session for project deliverables.",
    lengthInMinutes: 45,
    metadata: {
      module: "client-delivery",
      projectPhase: "review",
    },
  },

  // === Support & Training ===
  {
    slug: "technical-support",
    title: "Technical Support Session",
    description: "One-on-one technical assistance and troubleshooting.",
    lengthInMinutes: 30,
    lengthInMinutesOptions: [15, 30, 60],
    metadata: {
      module: "client-delivery",
      supportTier: "standard",
    },
  },
  {
    slug: "training-session",
    title: "Training Session",
    description: "Personalized training on systems, tools, or workflows.",
    lengthInMinutes: 60,
    metadata: {
      module: "client-delivery",
      activityType: "training",
    },
  },
  {
    slug: "vip-support",
    title: "VIP Priority Support",
    description: "Priority support for VIP clients with immediate attention.",
    lengthInMinutes: 30,
    metadata: {
      module: "client-delivery",
      supportTier: "vip",
      priority: "high",
    },
  },

  // === Strategic Planning ===
  {
    slug: "quarterly-planning",
    title: "Quarterly Business Planning",
    description: "Strategic planning session for upcoming quarter.",
    lengthInMinutes: 90,
    metadata: {
      module: "data-intelligence",
      planningCycle: "quarterly",
      recurring: true,
    },
  },
  {
    slug: "performance-review",
    title: "Performance Review Meeting",
    description: "Review metrics, KPIs, and optimization opportunities.",
    lengthInMinutes: 60,
    metadata: {
      module: "data-intelligence",
      activityType: "review",
      recurring: true,
    },
  },

  // === AI & Optimization ===
  {
    slug: "ai-optimization-review",
    title: "AI Optimization Review",
    description: "Review AI-powered insights and optimization recommendations.",
    lengthInMinutes: 45,
    metadata: {
      module: "ai-optimization",
      activityType: "review",
    },
  },

  // === Marketing & Growth ===
  {
    slug: "marketing-strategy",
    title: "Marketing Strategy Session",
    description: "Plan and optimize your marketing campaigns and funnels.",
    lengthInMinutes: 60,
    metadata: {
      module: "marketing-automation",
      activityType: "strategy",
    },
  },
  {
    slug: "funnel-optimization",
    title: "Funnel Optimization Review",
    description: "Analyze and optimize your conversion funnels.",
    lengthInMinutes: 45,
    metadata: {
      module: "marketing-automation",
      activityType: "optimization",
    },
  },

  // === Admin & Internal ===
  {
    slug: "internal-sync",
    title: "Internal Team Sync",
    description: "Internal team coordination and planning.",
    lengthInMinutes: 30,
    hidden: true,
    metadata: {
      internal: true,
      module: "admin",
    },
  },
];

/**
 * Get event type config by slug
 */
export function getEventTypeBySlug(slug: string): CalEventTypeConfig | undefined {
  return CAL_EVENT_TYPES.find(et => et.slug === slug);
}

/**
 * Get event types by module
 */
export function getEventTypesByModule(module: string): CalEventTypeConfig[] {
  return CAL_EVENT_TYPES.filter(et => et.metadata?.module === module);
}

/**
 * Get visible (non-hidden) event types
 */
export function getVisibleEventTypes(): CalEventTypeConfig[] {
  return CAL_EVENT_TYPES.filter(et => !et.hidden);
}
