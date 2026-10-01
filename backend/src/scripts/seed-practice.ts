import { prisma } from "../database/client.js";

/**
 * Seeds default practice tracks into the database.
 * Safe to re-run — uses upsert keyed on title to avoid duplicates.
 */

interface PracticeTrack {
  title: string;
  description: string;
  category: "TECH" | "SALES" | "HR" | "COMMUNICATION" | "FRONTEND" | "BACKEND" | "FULLSTACK" | "MOBILE" | "DEVOPS" | "DATA_SCIENCE" | "MACHINE_LEARNING" | "SYSTEM_DESIGN" | "PRODUCT_MANAGEMENT" | "OTHER";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  requiredSkills: string[];
  technologies: string[];
  estimatedDuration: number;
  isFeatured: boolean;
}

const PRACTICE_TRACKS: PracticeTrack[] = [
  // ── Frontend ──────────────────────────────────────────────
  {
    title: "Junior React Developer",
    description:
      "Practice a technical interview for a junior React developer position. You'll be asked about React fundamentals including components, hooks, state management, lifecycle methods, and JSX. The interviewer will also cover basic JavaScript concepts, DOM manipulation, CSS layout techniques, and responsive design principles. Ideal for candidates with 0–1 years of experience looking to land their first frontend role.",
    category: "FRONTEND",
    difficulty: "BEGINNER",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Git"],
    technologies: ["React", "JavaScript", "CSS", "Webpack"],
    estimatedDuration: 20,
    isFeatured: true,
  },
  {
    title: "Senior Frontend Engineer",
    description:
      "A comprehensive technical interview simulating a senior frontend position. Expect deep-dive questions on advanced React patterns (render props, compound components, custom hooks), performance optimization (code splitting, memoization, virtual DOM diffing), state management architecture (Redux, Zustand, Context), testing strategies (unit, integration, E2E), TypeScript generics, and micro-frontend design. Candidates should be comfortable discussing architectural trade-offs and leading technical discussions.",
    category: "FRONTEND",
    difficulty: "ADVANCED",
    requiredSkills: ["React", "TypeScript", "Next.js", "Performance Optimization", "Testing", "State Management"],
    technologies: ["React", "TypeScript", "Next.js", "Redux", "Jest", "Cypress"],
    estimatedDuration: 35,
    isFeatured: true,
  },

  // ── Backend ───────────────────────────────────────────────
  {
    title: "Node.js Backend Developer",
    description:
      "Practice interview for a mid-level Node.js backend developer. Topics include RESTful API design, Express/Fastify middleware patterns, database design with PostgreSQL, ORM usage (Prisma/Sequelize), authentication flows (JWT, OAuth 2.0), error handling strategies, input validation, and basic DevOps concepts like containerization. You'll also be asked about asynchronous programming, event-driven architecture, and writing production-ready code.",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Node.js", "Express", "PostgreSQL", "REST APIs", "Authentication"],
    technologies: ["Node.js", "Express", "PostgreSQL", "Prisma", "Redis", "Docker"],
    estimatedDuration: 30,
    isFeatured: true,
  },
  {
    title: "Python Backend Engineer",
    description:
      "Technical interview focused on Python backend development. Covers FastAPI/Django frameworks, database modeling with SQLAlchemy, asynchronous programming with asyncio, API versioning, background task processing with Celery, caching strategies, security best practices (OWASP Top 10), and deployment pipelines. The interviewer will probe your understanding of Python internals, the GIL, and how to build scalable, maintainable backend services.",
    category: "BACKEND",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    technologies: ["Python", "FastAPI", "SQLAlchemy", "Celery", "Redis", "Docker"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── Full Stack ────────────────────────────────────────────
  {
    title: "Full Stack Web Developer",
    description:
      "A well-rounded interview covering both frontend and backend skills. You'll discuss React component architecture, API integration, database schema design, server-side rendering (SSR) vs client-side rendering (CSR), deployment strategies, and end-to-end testing. The interviewer will assess your ability to reason about the full request lifecycle, from user interaction in the browser to database query optimization and response rendering.",
    category: "FULLSTACK",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "REST APIs", "Git"],
    technologies: ["React", "Next.js", "Node.js", "Express", "PostgreSQL", "Prisma"],
    estimatedDuration: 35,
    isFeatured: true,
  },

  // ── System Design ─────────────────────────────────────────
  {
    title: "System Design Fundamentals",
    description:
      "Practice a system design interview covering foundational topics. You'll be asked to design scalable systems like a URL shortener, a chat application, or a news feed. The interviewer will evaluate your understanding of load balancers, caching layers (CDN, Redis), database sharding, message queues, CAP theorem, eventual consistency, and how to estimate capacity and throughput. Great preparation for FAANG-style system design rounds.",
    category: "SYSTEM_DESIGN",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Distributed Systems", "Databases", "Caching", "Load Balancing", "API Design"],
    technologies: ["Redis", "Kafka", "PostgreSQL", "Nginx", "Docker", "Kubernetes"],
    estimatedDuration: 40,
    isFeatured: true,
  },
  {
    title: "Advanced System Design",
    description:
      "A senior-level system design interview simulating a Staff/Principal engineer round. Expect to design complex distributed systems — real-time collaboration tools, payment processing pipelines, or global-scale search engines. The interviewer will push hard on consistency guarantees, fault tolerance, event sourcing, CQRS, observability (tracing, metrics, logging), and multi-region replication strategies. You should be comfortable whiteboarding end-to-end architectures and defending your design choices under scrutiny.",
    category: "SYSTEM_DESIGN",
    difficulty: "EXPERT",
    requiredSkills: ["Distributed Systems", "Microservices", "Event Sourcing", "Observability", "Cloud Architecture"],
    technologies: ["Kafka", "Kubernetes", "Terraform", "gRPC", "Elasticsearch", "Prometheus"],
    estimatedDuration: 45,
    isFeatured: false,
  },

  // ── DevOps ────────────────────────────────────────────────
  {
    title: "DevOps & Cloud Engineer",
    description:
      "Practice a DevOps engineering interview covering CI/CD pipeline design, infrastructure as code (Terraform, Pulumi), container orchestration with Kubernetes, monitoring and alerting (Prometheus, Grafana), log aggregation, cloud services (AWS/GCP/Azure), networking fundamentals, and security hardening. You'll be expected to discuss incident response, SRE practices, SLA/SLO/SLI definitions, and how to design highly available production environments.",
    category: "DEVOPS",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Docker", "Kubernetes", "CI/CD", "Terraform", "Cloud Platforms"],
    technologies: ["Docker", "Kubernetes", "AWS", "Terraform", "GitHub Actions", "Prometheus"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── Mobile ────────────────────────────────────────────────
  {
    title: "React Native Mobile Developer",
    description:
      "Technical interview for a React Native mobile developer position. Topics include mobile app architecture, navigation patterns (React Navigation), platform-specific code, native module bridging, performance optimization (FlatList, memoization), offline storage (AsyncStorage, SQLite), push notifications, app store deployment pipelines, and responsive layouts for multiple screen sizes. You'll also discuss debugging techniques and handling device-specific quirks.",
    category: "MOBILE",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["React Native", "JavaScript", "TypeScript", "Mobile UI", "REST APIs"],
    technologies: ["React Native", "Expo", "TypeScript", "Redux", "Firebase"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── Data Science ──────────────────────────────────────────
  {
    title: "Data Science & Analytics",
    description:
      "Practice a data science interview covering statistics fundamentals, hypothesis testing, A/B experiment design, feature engineering, model selection and evaluation (precision, recall, F1, AUC-ROC), SQL for analytics, and data visualization with Python (matplotlib, seaborn, plotly). The interviewer will assess your ability to translate business problems into analytical frameworks and communicate insights clearly to non-technical stakeholders.",
    category: "DATA_SCIENCE",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Python", "SQL", "Statistics", "Machine Learning", "Data Visualization"],
    technologies: ["Python", "Pandas", "Scikit-learn", "SQL", "Jupyter", "Tableau"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── Beginner-friendly entry ───────────────────────────────
  {
    title: "Your First Tech Interview",
    description:
      "A gentle, encouraging mock interview designed for complete beginners entering the tech industry. Covers basic programming concepts (variables, loops, functions, data structures), problem-solving approaches, how to think out loud, how to ask clarifying questions, and how to handle 'I don't know' moments gracefully. The AI interviewer will provide a supportive environment to build your confidence before real interviews. Perfect for bootcamp graduates and self-taught developers.",
    category: "OTHER",
    difficulty: "BEGINNER",
    requiredSkills: ["Programming Basics", "Problem Solving", "Communication"],
    technologies: ["JavaScript", "Python"],
    estimatedDuration: 15,
    isFeatured: true,
  },

  // ── Sales Roles ───────────────────────────────────────────
  {
    title: "Enterprise Account Executive (AE)",
    description:
      "Simulate a high-stakes enterprise sales discovery and pitch interview. You will be evaluated on executive discovery, MEDDPICC qualification, pitching ROI and strategic business outcomes, handling competitive and pricing objections, and driving mutual action plans for deal closing.",
    category: "SALES",
    difficulty: "ADVANCED",
    requiredSkills: ["Enterprise Discovery", "Value Proposition Pitching", "Objection Handling", "Closing & Deal Control", "MEDDPICC"],
    technologies: ["Salesforce", "Gong", "HubSpot", "LinkedIn Sales Navigator"],
    estimatedDuration: 25,
    isFeatured: true,
  },
  {
    title: "Business Development Representative (BDR / SDR)",
    description:
      "Practice outbound prospecting, cold calling simulation, and active listening. You will be evaluated on your opening hook, qualifying prospect pain points, overcoming initial brush-offs ('send me an email', 'no budget'), and securing qualified discovery meetings.",
    category: "SALES",
    difficulty: "BEGINNER",
    requiredSkills: ["Cold Outreach", "Active Listening", "Pain Discovery", "Objection Handling", "Call Cadence"],
    technologies: ["Outreach", "Salesloft", "ZoomInfo", "Apollo"],
    estimatedDuration: 20,
    isFeatured: false,
  },
  {
    title: "Strategic Sales Lead & Account Manager",
    description:
      "Role-play strategic upsell, expansion, and client retention scenarios. You will be evaluated on multi-threading key stakeholders, defending contract pricing during renewals, consulting on client growth, and building trusted executive partnerships.",
    category: "SALES",
    difficulty: "EXPERT",
    requiredSkills: ["Account Expansion", "Contract Negotiation", "Stakeholder Management", "Executive Relationship Building"],
    technologies: ["Salesforce", "Catalyst", "ChurnZero"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── HR & People Roles ─────────────────────────────────────
  {
    title: "Human Resources Business Partner (HRBP)",
    description:
      "Mock interview evaluating strategic HR leadership, organizational design, conflict mediation, and leadership coaching. You will tackle realistic employee relations disputes, performance improvement plans (PIPs), and organizational restructuring scenarios.",
    category: "HR",
    difficulty: "ADVANCED",
    requiredSkills: ["Conflict Resolution", "Employee Relations", "Organizational Design", "Performance Coaching", "Labor Compliance"],
    technologies: ["Workday", "BambooHR", "Lattice", "Culture Amp"],
    estimatedDuration: 25,
    isFeatured: true,
  },
  {
    title: "Technical Talent Acquisition Specialist",
    description:
      "Assess your end-to-end recruitment capabilities including tech sourcing, candidate experience, hiring manager alignment, and closing candidates on compensation. You will demonstrate behavioral interviewing techniques and offer negotiation.",
    category: "HR",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["Tech Sourcing", "Behavioral Interviewing", "Offer Negotiation", "Hiring Manager Partnership"],
    technologies: ["Greenhouse", "Lever", "LinkedIn Recruiter", "Gem"],
    estimatedDuration: 20,
    isFeatured: false,
  },
  {
    title: "Head of People & Culture",
    description:
      "Executive-level people leadership assessment. Topics cover establishing company culture, scaling compensation bands, handling severe workplace misconduct investigations, retention strategies, and DE&I frameworks.",
    category: "HR",
    difficulty: "EXPERT",
    requiredSkills: ["People Strategy", "Culture & Retention", "Compliance & Investigation", "Compensation & Benefits", "Change Management"],
    technologies: ["Workday", "Carta", "Pave", "ChartHop"],
    estimatedDuration: 30,
    isFeatured: false,
  },

  // ── Communication & Behavioral Mastery ────────────────────
  {
    title: "Executive Storytelling & Leadership Communication",
    description:
      "Master high-impact communication for leadership and cross-functional roles. You will be evaluated on structured communication frameworks (PREP, Pyramid Principle), translating complex problems into concise executive summaries, vocal conviction, and active listening under scrutiny.",
    category: "COMMUNICATION",
    difficulty: "ADVANCED",
    requiredSkills: ["PREP Framework", "Executive Presence", "Concise Storytelling", "Active Listening", "Vocal Conviction"],
    technologies: ["Presentation Frameworks", "Executive Briefing"],
    estimatedDuration: 20,
    isFeatured: true,
  },
  {
    title: "Difficult Conversations & Stakeholder Alignment",
    description:
      "Practice navigating sensitive, high-pressure professional conversations. Scenarios include delivering tough feedback to peers or managers, handling pushback, de-escalating tense disagreements, and driving alignment across conflicting priorities.",
    category: "COMMUNICATION",
    difficulty: "INTERMEDIATE",
    requiredSkills: ["De-escalation", "Empathetic Listening", "Constructive Feedback", "Stakeholder Alignment", "Composure"],
    technologies: ["Crucial Conversations", "Nonviolent Communication"],
    estimatedDuration: 20,
    isFeatured: false,
  },
  {
    title: "Behavioral Interview Mastery (STAR Method)",
    description:
      "A comprehensive behavioral interview workshop focusing on the STAR method (Situation, Task, Action, Result). Practice answering tough situational questions on failure, leadership, ambiguity, and teamwork with high precision and memorable impact.",
    category: "COMMUNICATION",
    difficulty: "BEGINNER",
    requiredSkills: ["STAR Method", "Impact Quantification", "Brevity & Focus", "Articulation", "Authenticity"],
    technologies: ["Behavioral Rubrics", "STAR Framework"],
    estimatedDuration: 20,
    isFeatured: true,
  },
];

async function main() {
  console.log("\n🌱 Seeding practice tracks...\n");

  // Attempt to add enum values if running against PostgreSQL
  const newEnums = ["TECH", "SALES", "HR", "COMMUNICATION"];
  for (const enumVal of newEnums) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "PracticeJobCategory" ADD VALUE IF NOT EXISTS '${enumVal}';`);
    } catch {
      // Ignore if database does not use native enum or value exists
    }
  }

  let created = 0;
  let skipped = 0;

  for (const track of PRACTICE_TRACKS) {
    // Check if a track with the same title already exists
    const existing = await prisma.practiceJob.findFirst({
      where: { title: track.title },
    });

    if (existing) {
      console.log(`  ⏭  "${track.title}" already exists — skipping`);
      skipped++;
      continue;
    }

    try {
      await prisma.practiceJob.create({
        data: {
          title: track.title,
          description: track.description,
          category: track.category as any,
          difficulty: track.difficulty,
          requiredSkills: track.requiredSkills,
          technologies: track.technologies,
          estimatedDuration: track.estimatedDuration,
          isFeatured: track.isFeatured,
          isPublished: true,
        },
      });

      console.log(`  ✅ Created "${track.title}" [${track.category} · ${track.difficulty}]`);
      created++;
    } catch (err: any) {
      console.warn(`  ⚠️ Could not create "${track.title}":`, err?.message || err);
    }
  }

  console.log(`\n🎉 Done! Created ${created} tracks, skipped ${skipped} existing.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error seeding practice tracks:", err);
  process.exit(1);
});
