import { logger } from "../../utils/logger.js";
import { config } from "../../config/index.js";

// SessionTimeoutManager - Monitors interview session inactivity
//
// Automatically abandons sessions that:
// - Have no heartbeat for 5 minutes
// - Exceed maximum duration (45 minutes default)
//
// Prevents:
// - Zombie sessions consuming resources
// - Candidates gaming the system by keeping tabs open
// - Interview credits being locked indefinitely

interface SessionTimeout {
  timer: NodeJS.Timeout;
  startTime: number;
  lastActivity: number;
}

export class SessionTimeoutManager {
  private sessions: Map<string, SessionTimeout>;
  private inactivityThreshold: number;
  private maxDuration: number;

  constructor() {
    this.sessions = new Map();
    this.inactivityThreshold = 5 * 60 * 1000; // 5 minutes
    this.maxDuration = config.interview.timeoutMinutes * 60 * 1000;

    logger.info("[SessionTimeoutManager] Initialized", {
      inactivityThreshold: `${this.inactivityThreshold / 1000}s`,
      maxDuration: `${this.maxDuration / 60000}min`,
    });
  }

  // startMonitoring
  // Begins tracking a session for timeout conditions.

  startMonitoring(sessionId: string, onTimeout: () => void) {
    if (this.sessions.has(sessionId)) {
      logger.warn("[SessionTimeoutManager] Session already monitored", {
        sessionId,
      });
      return;
    }

    const now = Date.now();

    const timer = setInterval(() => {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const timeSinceActivity = Date.now() - session.lastActivity;
      const totalDuration = Date.now() - session.startTime;

      // Check inactivity timeout
      if (timeSinceActivity > this.inactivityThreshold) {
        logger.warn("[SessionTimeoutManager] Inactivity timeout", {
          sessionId,
          inactiveDuration: `${Math.floor(timeSinceActivity / 1000)}s`,
        });
        this.stopMonitoring(sessionId);
        onTimeout();
        return;
      }

      // Check max duration timeout
      if (totalDuration > this.maxDuration) {
        logger.warn("[SessionTimeoutManager] Max duration exceeded", {
          sessionId,
          duration: `${Math.floor(totalDuration / 60000)}min`,
        });
        this.stopMonitoring(sessionId);
        onTimeout();
        return;
      }
    }, 30000); // Check every 30 seconds

    this.sessions.set(sessionId, {
      timer,
      startTime: now,
      lastActivity: now,
    });

    logger.info("[SessionTimeoutManager] Monitoring started", { sessionId });
  }

  // resetTimeout
  // Resets the inactivity timer when user sends a heartbeat or submits answer.

  resetTimeout(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivity = Date.now();

    logger.debug("[SessionTimeoutManager] Activity detected", { sessionId });
  }

  // stopMonitoring
  // Stops tracking a session (called on completion or disconnect).

  stopMonitoring(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    clearInterval(session.timer);
    this.sessions.delete(sessionId);

    logger.info("[SessionTimeoutManager] Monitoring stopped", { sessionId });
  }

  // cleanup
  // Clears all active timers (called on server shutdown).

  cleanup() {
    logger.info("[SessionTimeoutManager] Cleaning up all sessions...");

    for (const [sessionId, session] of this.sessions.entries()) {
      clearInterval(session.timer);
      logger.debug("[SessionTimeoutManager] Cleared timer", { sessionId });
    }

    this.sessions.clear();

    logger.info("[SessionTimeoutManager] Cleanup complete");
  }

  // getActiveSessionCount
  // Returns the number of sessions currently being monitored.

  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
