/**
 * Expertise Scorer Service
 *
 * Core scoring service for the Intelligence Platform expertise features.
 * Implements time-decay based expertise scoring with configurable weights.
 *
 * Algorithm:
 * expertise_score = sum(signal_weight * count * decay(days, tau))
 *
 * Where decay uses exponential decay: e^(-days/tau)
 */

export interface SignalConfig {
  weight: number;  // Multiplier for this signal type
  tau: number;     // Half-life in days for decay
}

export interface DecayConfig {
  commits: SignalConfig;
  mrsAuthored: SignalConfig;
  mrsReviewed: SignalConfig;
  issuesAssigned: SignalConfig;
  comments: SignalConfig;
}

/**
 * Default decay configuration based on the intelligence platform spec
 *
 * Weights reflect the relative importance of each signal:
 * - MRs authored (4.0) = highest signal - direct code ownership
 * - Commits (3.0) = strong signal - code changes
 * - MRs reviewed (2.0) = moderate signal - code familiarity
 * - Issues assigned (2.0) = moderate signal - domain knowledge
 * - Comments (0.5) = weak signal - engagement but not ownership
 *
 * Tau values control how quickly expertise decays:
 * - Higher tau = slower decay (expertise persists longer)
 * - Lower tau = faster decay (recent activity matters more)
 */
export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  commits: { weight: 3.0, tau: 90 },
  mrsAuthored: { weight: 4.0, tau: 120 },
  mrsReviewed: { weight: 2.0, tau: 60 },
  issuesAssigned: { weight: 2.0, tau: 45 },
  comments: { weight: 0.5, tau: 30 },
};

/**
 * Calculate exponential decay factor
 *
 * Uses the formula: e^(-days/tau)
 * - At days=0: returns 1.0 (full weight)
 * - At days=tau: returns ~0.37 (about 37% weight)
 * - At days=2*tau: returns ~0.14 (about 14% weight)
 *
 * @param days - Number of days since the activity
 * @param tau - Decay constant (half-life in days)
 * @returns Decay factor between 0 and 1
 */
export function decay(days: number, tau: number): number {
  if (days < 0) return 1.0; // Future dates get full weight
  if (tau <= 0) return 0; // Invalid tau
  return Math.exp(-days / tau);
}

/**
 * Calculate days since a given date
 *
 * @param date - The date to calculate from
 * @param now - Optional reference date (defaults to current time)
 * @returns Number of days (can be fractional)
 */
export function daysSince(date: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Calculate score for a single signal (e.g., one commit)
 *
 * @param date - When the activity occurred
 * @param config - Signal configuration (weight and tau)
 * @param now - Optional reference date for testing
 * @returns Weighted, time-decayed score
 */
export function calculateSignalScore(
  date: Date,
  config: SignalConfig,
  now: Date = new Date()
): number {
  const days = daysSince(date, now);
  const decayFactor = decay(days, config.tau);
  return config.weight * decayFactor;
}

/**
 * Calculate aggregated score for multiple activities of the same type
 *
 * @param dates - Array of activity dates
 * @param config - Signal configuration
 * @param now - Optional reference date
 * @returns Total weighted, time-decayed score
 */
export function calculateAggregatedScore(
  dates: Date[],
  config: SignalConfig,
  now: Date = new Date()
): number {
  return dates.reduce((total, date) => {
    return total + calculateSignalScore(date, config, now);
  }, 0);
}

/**
 * Expertise signals for a person on a file/directory/topic
 */
export interface ExpertiseSignals {
  commits: Date[];
  mrsAuthored: Date[];
  mrsReviewed: Date[];
  issuesAssigned: Date[];
  comments: Date[];
}

/**
 * Calculate total expertise score from all signals
 *
 * @param signals - Activity dates grouped by signal type
 * @param config - Decay configuration (defaults to DEFAULT_DECAY_CONFIG)
 * @param now - Optional reference date
 * @returns Total expertise score and breakdown
 */
export function calculateExpertiseScore(
  signals: ExpertiseSignals,
  config: DecayConfig = DEFAULT_DECAY_CONFIG,
  now: Date = new Date()
): {
  total: number;
  breakdown: {
    commits: number;
    mrsAuthored: number;
    mrsReviewed: number;
    issuesAssigned: number;
    comments: number;
  };
} {
  const breakdown = {
    commits: calculateAggregatedScore(signals.commits, config.commits, now),
    mrsAuthored: calculateAggregatedScore(signals.mrsAuthored, config.mrsAuthored, now),
    mrsReviewed: calculateAggregatedScore(signals.mrsReviewed, config.mrsReviewed, now),
    issuesAssigned: calculateAggregatedScore(signals.issuesAssigned, config.issuesAssigned, now),
    comments: calculateAggregatedScore(signals.comments, config.comments, now),
  };

  const total =
    breakdown.commits +
    breakdown.mrsAuthored +
    breakdown.mrsReviewed +
    breakdown.issuesAssigned +
    breakdown.comments;

  return { total, breakdown };
}

/**
 * Normalize a score to a 0-100 scale for display
 *
 * @param score - Raw expertise score
 * @param maxScore - Maximum expected score for normalization
 * @returns Normalized score between 0 and 100
 */
export function normalizeScore(score: number, maxScore: number = 100): number {
  if (maxScore <= 0) return 0;
  return Math.min(100, Math.round((score / maxScore) * 100));
}

// ============================================================================
// Database Query Functions
// ============================================================================

import { type PrismaClient } from "../../../generated/prisma";

export interface CommitExpertise {
  personId: string;
  commitCount: number;
  lastCommitDate: Date;
  score: number;
}

/**
 * Get commit-based expertise for a file or directory
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param target - File ID or directory path
 * @param isDirectory - Whether target is a directory path
 * @param config - Optional decay config
 * @returns Expertise scores per person, sorted by score DESC
 */
export async function getCommitExpertise(
  db: PrismaClient,
  userId: string,
  target: string,
  isDirectory: boolean = false,
  config: SignalConfig = DEFAULT_DECAY_CONFIG.commits
): Promise<CommitExpertise[]> {
  // Get commits touching the target file(s)
  let commits: Array<{ personId: string | null; authoredAt: Date }>;

  if (isDirectory) {
    // Query commits for all files in the directory
    commits = await db.commit.findMany({
      where: {
        userId,
        personId: { not: null },
        files: {
          some: {
            file: {
              directory: { startsWith: target },
            },
          },
        },
      },
      select: {
        personId: true,
        authoredAt: true,
      },
    });
  } else {
    // Query commits for a specific file
    commits = await db.commit.findMany({
      where: {
        userId,
        personId: { not: null },
        files: {
          some: {
            fileId: target,
          },
        },
      },
      select: {
        personId: true,
        authoredAt: true,
      },
    });
  }

  // Group by person and calculate scores
  const expertiseMap = new Map<
    string,
    { commitCount: number; lastCommitDate: Date; score: number }
  >();

  const now = new Date();

  for (const commit of commits) {
    if (!commit.personId) continue;

    const existing = expertiseMap.get(commit.personId);
    const commitScore = calculateSignalScore(commit.authoredAt, config, now);

    if (existing) {
      existing.commitCount++;
      existing.score += commitScore;
      if (commit.authoredAt > existing.lastCommitDate) {
        existing.lastCommitDate = commit.authoredAt;
      }
    } else {
      expertiseMap.set(commit.personId, {
        commitCount: 1,
        lastCommitDate: commit.authoredAt,
        score: commitScore,
      });
    }
  }

  // Convert to array and sort by score
  const results: CommitExpertise[] = Array.from(expertiseMap.entries())
    .map(([personId, data]) => ({
      personId,
      ...data,
    }))
    .sort((a, b) => b.score - a.score);

  return results;
}

export interface MRExpertise {
  personId: string;
  username: string;
  mrsAuthored: number;
  mrsReviewed: number;
  lastMRDate: Date;
  authoredScore: number;
  reviewedScore: number;
  totalScore: number;
}

/**
 * Get MR-based expertise for files matching a path pattern
 *
 * NOTE: Until Epic 11 adds MR→File relationships, this uses a fallback
 * approach that searches Event titles/bodies for file path mentions.
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param pathPattern - File path or directory to search for
 * @param config - Optional decay config
 * @returns Expertise scores per person, sorted by totalScore DESC
 */
export async function getMRExpertise(
  db: PrismaClient,
  userId: string,
  pathPattern: string,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): Promise<MRExpertise[]> {
  // Search MR events that mention the path pattern
  const mrEvents = await db.event.findMany({
    where: {
      userId,
      type: "merge_request",
      OR: [
        { title: { contains: pathPattern, mode: "insensitive" } },
        { body: { contains: pathPattern, mode: "insensitive" } },
      ],
    },
    select: {
      author: true,
      createdAt: true,
    },
  });

  // Group by author
  const expertiseMap = new Map<
    string,
    {
      mrsAuthored: number;
      mrsReviewed: number;
      lastMRDate: Date;
      authoredScore: number;
      reviewedScore: number;
    }
  >();

  const now = new Date();

  for (const mr of mrEvents) {
    const existing = expertiseMap.get(mr.author);
    const authoredScore = calculateSignalScore(mr.createdAt, config.mrsAuthored, now);

    if (existing) {
      existing.mrsAuthored++;
      existing.authoredScore += authoredScore;
      if (mr.createdAt > existing.lastMRDate) {
        existing.lastMRDate = mr.createdAt;
      }
    } else {
      expertiseMap.set(mr.author, {
        mrsAuthored: 1,
        mrsReviewed: 0, // Placeholder - requires review data from Epic 11
        lastMRDate: mr.createdAt,
        authoredScore,
        reviewedScore: 0,
      });
    }
  }

  // Get Person IDs for the authors
  const usernames = Array.from(expertiseMap.keys());
  const people = await db.person.findMany({
    where: {
      userId,
      username: { in: usernames },
    },
    select: { id: true, username: true },
  });

  const personIdMap = new Map(people.map((p) => [p.username, p.id]));

  // Convert to array and sort by total score
  const results: MRExpertise[] = Array.from(expertiseMap.entries())
    .map(([username, data]) => ({
      personId: personIdMap.get(username) ?? `unknown-${username}`,
      username,
      ...data,
      totalScore: data.authoredScore + data.reviewedScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return results;
}

export interface IssueExpertise {
  personId: string;
  username: string;
  issuesAuthored: number;
  commentsCount: number;
  lastActivityDate: Date;
  issueScore: number;
  commentScore: number;
  totalScore: number;
}

/**
 * Get issue and comment-based expertise for a search term
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param searchTerms - File paths or keywords to search for
 * @param config - Optional decay config
 * @returns Expertise scores per person, sorted by totalScore DESC
 */
export async function getIssueExpertise(
  db: PrismaClient,
  userId: string,
  searchTerms: string[],
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): Promise<IssueExpertise[]> {
  // Build OR conditions for search terms
  const searchConditions = searchTerms.flatMap((term) => [
    { title: { contains: term, mode: "insensitive" as const } },
    { body: { contains: term, mode: "insensitive" as const } },
  ]);

  // Get issues matching search terms
  const issues = await db.event.findMany({
    where: {
      userId,
      type: "issue",
      OR: searchConditions,
    },
    select: {
      author: true,
      createdAt: true,
    },
  });

  // Get comments matching search terms
  const comments = await db.event.findMany({
    where: {
      userId,
      type: "comment",
      OR: searchConditions,
    },
    select: {
      author: true,
      createdAt: true,
    },
  });

  // Group by author
  const expertiseMap = new Map<
    string,
    {
      issuesAuthored: number;
      commentsCount: number;
      lastActivityDate: Date;
      issueScore: number;
      commentScore: number;
    }
  >();

  const now = new Date();

  // Process issues
  for (const issue of issues) {
    const existing = expertiseMap.get(issue.author);
    const score = calculateSignalScore(issue.createdAt, config.issuesAssigned, now);

    if (existing) {
      existing.issuesAuthored++;
      existing.issueScore += score;
      if (issue.createdAt > existing.lastActivityDate) {
        existing.lastActivityDate = issue.createdAt;
      }
    } else {
      expertiseMap.set(issue.author, {
        issuesAuthored: 1,
        commentsCount: 0,
        lastActivityDate: issue.createdAt,
        issueScore: score,
        commentScore: 0,
      });
    }
  }

  // Process comments
  for (const comment of comments) {
    const existing = expertiseMap.get(comment.author);
    const score = calculateSignalScore(comment.createdAt, config.comments, now);

    if (existing) {
      existing.commentsCount++;
      existing.commentScore += score;
      if (comment.createdAt > existing.lastActivityDate) {
        existing.lastActivityDate = comment.createdAt;
      }
    } else {
      expertiseMap.set(comment.author, {
        issuesAuthored: 0,
        commentsCount: 1,
        lastActivityDate: comment.createdAt,
        issueScore: 0,
        commentScore: score,
      });
    }
  }

  // Get Person IDs for the authors
  const usernames = Array.from(expertiseMap.keys());
  const people = await db.person.findMany({
    where: {
      userId,
      username: { in: usernames },
    },
    select: { id: true, username: true },
  });

  const personIdMap = new Map(people.map((p) => [p.username, p.id]));

  // Convert to array and sort by total score
  const results: IssueExpertise[] = Array.from(expertiseMap.entries())
    .map(([username, data]) => ({
      personId: personIdMap.get(username) ?? `unknown-${username}`,
      username,
      ...data,
      totalScore: data.issueScore + data.commentScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return results;
}

// ============================================================================
// Combined Expertise Calculation
// ============================================================================

export interface ExpertiseBreakdown {
  commits: { count: number; score: number };
  mrsAuthored: { count: number; score: number };
  mrsReviewed: { count: number; score: number };
  issues: { count: number; score: number };
  comments: { count: number; score: number };
}

export interface ExpertiseResult {
  person: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  totalScore: number;
  normalizedScore: number;
  breakdown: ExpertiseBreakdown;
  lastActivity: Date | null;
}

export interface ExpertiseQuery {
  filePath?: string;
  directory?: string;
  searchTerm?: string;
}

export interface ExpertiseOptions {
  limit?: number;
  config?: DecayConfig;
}

/**
 * Calculate combined expertise from all signal sources
 *
 * @param db - Prisma client
 * @param userId - User ID for data isolation
 * @param query - What to calculate expertise for
 * @param options - Calculation options
 * @returns Ranked list of experts with score breakdowns
 */
export async function calculateExpertise(
  db: PrismaClient,
  userId: string,
  query: ExpertiseQuery,
  options: ExpertiseOptions = {}
): Promise<ExpertiseResult[]> {
  const { limit = 10, config = DEFAULT_DECAY_CONFIG } = options;

  // Build search terms from query
  const searchTerms: string[] = [];
  if (query.filePath) searchTerms.push(query.filePath);
  if (query.directory) searchTerms.push(query.directory);
  if (query.searchTerm) searchTerms.push(query.searchTerm);

  if (searchTerms.length === 0) {
    return [];
  }

  // Aggregate expertise by username
  const expertiseMap = new Map<
    string,
    {
      commits: { count: number; score: number };
      mrsAuthored: { count: number; score: number };
      mrsReviewed: { count: number; score: number };
      issues: { count: number; score: number };
      comments: { count: number; score: number };
      lastActivity: Date | null;
    }
  >();

  const initExpertise = () => ({
    commits: { count: 0, score: 0 },
    mrsAuthored: { count: 0, score: 0 },
    mrsReviewed: { count: 0, score: 0 },
    issues: { count: 0, score: 0 },
    comments: { count: 0, score: 0 },
    lastActivity: null as Date | null,
  });

  // 1. Get commit expertise (if file or directory specified)
  if (query.filePath || query.directory) {
    const target = query.filePath ?? query.directory!;
    const isDirectory = !!query.directory;

    const commitExpertise = await getCommitExpertise(
      db,
      userId,
      target,
      isDirectory,
      config.commits
    );

    // Get usernames for commit authors
    const personIds = commitExpertise.map((c) => c.personId);
    const people = await db.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, username: true },
    });
    const usernameMap = new Map(people.map((p) => [p.id, p.username]));

    for (const ce of commitExpertise) {
      const username = usernameMap.get(ce.personId);
      if (!username) continue;

      const existing = expertiseMap.get(username) ?? initExpertise();
      existing.commits.count += ce.commitCount;
      existing.commits.score += ce.score;
      if (!existing.lastActivity || ce.lastCommitDate > existing.lastActivity) {
        existing.lastActivity = ce.lastCommitDate;
      }
      expertiseMap.set(username, existing);
    }
  }

  // 2. Get MR expertise
  for (const term of searchTerms) {
    const mrExpertise = await getMRExpertise(db, userId, term, config);

    for (const me of mrExpertise) {
      const existing = expertiseMap.get(me.username) ?? initExpertise();
      existing.mrsAuthored.count += me.mrsAuthored;
      existing.mrsAuthored.score += me.authoredScore;
      existing.mrsReviewed.count += me.mrsReviewed;
      existing.mrsReviewed.score += me.reviewedScore;
      if (!existing.lastActivity || me.lastMRDate > existing.lastActivity) {
        existing.lastActivity = me.lastMRDate;
      }
      expertiseMap.set(me.username, existing);
    }
  }

  // 3. Get issue/comment expertise
  const issueExpertise = await getIssueExpertise(db, userId, searchTerms, config);

  for (const ie of issueExpertise) {
    const existing = expertiseMap.get(ie.username) ?? initExpertise();
    existing.issues.count += ie.issuesAuthored;
    existing.issues.score += ie.issueScore;
    existing.comments.count += ie.commentsCount;
    existing.comments.score += ie.commentScore;
    if (!existing.lastActivity || ie.lastActivityDate > existing.lastActivity) {
      existing.lastActivity = ie.lastActivityDate;
    }
    expertiseMap.set(ie.username, existing);
  }

  // Calculate total scores and sort
  const scoredExperts = Array.from(expertiseMap.entries())
    .map(([username, data]) => ({
      username,
      totalScore:
        data.commits.score +
        data.mrsAuthored.score +
        data.mrsReviewed.score +
        data.issues.score +
        data.comments.score,
      breakdown: data,
      lastActivity: data.lastActivity,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  // Get Person details for top experts
  const usernames = scoredExperts.map((e) => e.username);
  const people = await db.person.findMany({
    where: {
      userId,
      username: { in: usernames },
    },
  });

  const personMap = new Map(people.map((p) => [p.username, p]));

  // Find max score for normalization
  const maxScore = scoredExperts[0]?.totalScore ?? 1;

  // Build final results
  const results: ExpertiseResult[] = scoredExperts.map((e) => {
    const person = personMap.get(e.username);
    return {
      person: {
        id: person?.id ?? `unknown-${e.username}`,
        username: e.username,
        name: person?.name ?? null,
        avatarUrl: person?.avatarUrl ?? null,
      },
      totalScore: e.totalScore,
      normalizedScore: normalizeScore(e.totalScore, maxScore),
      breakdown: {
        commits: e.breakdown.commits,
        mrsAuthored: e.breakdown.mrsAuthored,
        mrsReviewed: e.breakdown.mrsReviewed,
        issues: e.breakdown.issues,
        comments: e.breakdown.comments,
      },
      lastActivity: e.lastActivity,
    };
  });

  return results;
}
