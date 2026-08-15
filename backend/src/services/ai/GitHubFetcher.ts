import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// GitHubFetcher - Fetch public GitHub profile and repository data
//
// Uses GitHub REST API v3 (no authentication required for public data).
// Analyzes:
// - User profile (bio, location, company)
// - Top repositories (stars, languages, descriptions)
// - Activity level (public repos count)
//
// Documentation: https://docs.github.com/en/rest

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  profileUrl: string;
}

export interface GitHubRepository {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface GitHubAnalysis {
  profile: GitHubProfile;
  topRepositories: GitHubRepository[];
  summary: {
    totalStars: number;
    primaryLanguages: string[];
    projectCount: number;
    activityLevel: "low" | "medium" | "high";
  };
}

export class GitHubFetcher {
  private baseUrl = "https://api.github.com";
  private requestOptions: RequestInit;

  constructor() {
    // GitHub API accepts requests without authentication for public data
    // Rate limit: 60 requests/hour per IP (sufficient for our use case)
    this.requestOptions = {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Sensei-AI-Platform",
      },
    };
  }

  // fetchProfile
  // Retrieves public GitHub profile by username.
  //
  // Throws 404 if user not found or profile is private.

  async fetchProfile(username: string): Promise<GitHubProfile> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${username}`,
        this.requestOptions,
      );

      if (response.status === 404) {
        throw new ApiError(404, `GitHub user '${username}' not found`);
      }

      if (!response.ok) {
        throw new ApiError(502, "GitHub API unavailable");
      }

      const data = await response.json();

      logger.info("[GitHubFetcher] Profile fetched", {
        username,
        repos: data.public_repos,
      });

      return {
        username: data.login,
        name: data.name,
        bio: data.bio,
        location: data.location,
        company: data.company,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
        profileUrl: data.html_url,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[GitHubFetcher] Failed to fetch profile", error);
      throw new ApiError(500, "Failed to fetch GitHub profile");
    }
  }

  // fetchRepositories
  // Retrieves top public repositories for a user.
  //
  // Returns up to 10 repos sorted by stars (most popular first).

  async fetchRepositories(
    username: string,
    limit: number = 10,
  ): Promise<GitHubRepository[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${username}/repos?type=owner&sort=updated&per_page=${limit}`,
        this.requestOptions,
      );

      if (!response.ok) {
        throw new ApiError(502, "GitHub API unavailable");
      }

      const data = await response.json();

      // Sort by stars descending
      const sortedRepos = data.sort(
        (a: any, b: any) => b.stargazers_count - a.stargazers_count,
      );

      const repositories: GitHubRepository[] = sortedRepos
        .slice(0, limit)
        .map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          topics: repo.topics || [],
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          url: repo.html_url,
        }));

      logger.info("[GitHubFetcher] Repositories fetched", {
        username,
        count: repositories.length,
      });

      return repositories;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[GitHubFetcher] Failed to fetch repositories", error);
      throw new ApiError(500, "Failed to fetch GitHub repositories");
    }
  }

  // analyzeGitHub
  // Complete GitHub analysis: profile + repos + computed metrics.
  //
  // Returns structured data ready for AI screening.

  async analyzeGitHub(githubUrl: string): Promise<GitHubAnalysis> {
    try {
      // Extract username from URL
      const username = this.extractUsername(githubUrl);

      // Fetch profile and repos in parallel
      const [profile, repositories] = await Promise.all([
        this.fetchProfile(username),
        this.fetchRepositories(username, 10),
      ]);

      // Compute summary metrics
      const totalStars = repositories.reduce(
        (sum, repo) => sum + repo.stars,
        0,
      );

      const languageCounts: Record<string, number> = {};
      repositories.forEach((repo) => {
        if (repo.language) {
          languageCounts[repo.language] =
            (languageCounts[repo.language] || 0) + 1;
        }
      });

      const primaryLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      // Activity level based on public repos and stars
      let activityLevel: "low" | "medium" | "high" = "low";
      if (profile.publicRepos >= 20 || totalStars >= 100) {
        activityLevel = "high";
      } else if (profile.publicRepos >= 5 || totalStars >= 10) {
        activityLevel = "medium";
      }

      logger.info("[GitHubFetcher] Analysis complete", {
        username,
        totalStars,
        activityLevel,
      });

      return {
        profile,
        topRepositories: repositories,
        summary: {
          totalStars,
          primaryLanguages,
          projectCount: profile.publicRepos,
          activityLevel,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[GitHubFetcher] Analysis failed", error);
      throw new ApiError(500, "Failed to analyze GitHub profile");
    }
  }

  // extractUsername
  // Extracts GitHub username from various URL formats.
  //
  // Supported:
  //   https://github.com/username
  //   github.com/username
  //   username (raw username)

  private extractUsername(githubUrl: string): string {
    try {
      // Remove trailing slashes
      const cleaned = githubUrl.trim().replace(/\/+$/, "");

      // Try parsing as URL
      try {
        const url = new URL(
          cleaned.startsWith("http") ? cleaned : `https://${cleaned}`,
        );
        const pathParts = url.pathname.split("/").filter((p) => p.length > 0);

        if (pathParts.length === 0) {
          throw new Error("No username in URL");
        }

        return pathParts[0];
      } catch {
        // Fallback: treat entire string as username
        const username = cleaned.split("/").pop() || cleaned;
        if (!/^[a-zA-Z0-9-]+$/.test(username)) {
          throw new Error("Invalid GitHub username format");
        }
        return username;
      }
    } catch (error) {
      logger.error("[GitHubFetcher] Invalid GitHub URL", { githubUrl });
      throw new ApiError(400, "Invalid GitHub URL format");
    }
  }
}

export const githubFetcher = new GitHubFetcher();
