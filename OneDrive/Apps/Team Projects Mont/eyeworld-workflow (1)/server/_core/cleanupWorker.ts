/**
 * S3 Auto-Deletion Cleanup Worker
 *
 * Runs every 24 hours and deletes S3 files for attachments where:
 *   - scheduledDeleteAt <= now
 *   - isDeleted = false
 *
 * Preserves all DB records (task, comments, attachment metadata).
 * Only deletes the actual S3 file and marks isDeleted = true.
 */

import * as db from "../db";
import { storageDelete } from "../storage";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function runCleanup() {
  console.log("[CleanupWorker] Running S3 attachment cleanup...");

  let pending: Awaited<ReturnType<typeof db.getPendingDeletionAttachments>>;
  try {
    pending = await db.getPendingDeletionAttachments();
  } catch (err) {
    console.error("[CleanupWorker] Failed to fetch pending deletions:", err);
    return;
  }

  if (pending.length === 0) {
    console.log("[CleanupWorker] No attachments pending deletion.");
    return;
  }

  console.log(`[CleanupWorker] Found ${pending.length} attachment(s) to delete.`);

  for (const attachment of pending) {
    try {
      await storageDelete(attachment.storageKey);
      await db.markAttachmentDeleted(attachment.id);
      console.log(
        `[CleanupWorker] Deleted attachment #${attachment.id} — key: ${attachment.storageKey}`,
      );
    } catch (err) {
      console.error(
        `[CleanupWorker] Failed to delete attachment #${attachment.id} (key: ${attachment.storageKey}):`,
        err,
      );
      // Continue with next attachment even if this one fails
    }
  }

  console.log("[CleanupWorker] Cleanup cycle complete.");
}

export function startCleanupWorker() {
  // Run once shortly after startup (give DB time to connect)
  setTimeout(() => {
    runCleanup().catch(err =>
      console.error("[CleanupWorker] Initial run failed:", err)
    );
  }, 30_000); // 30 seconds after startup

  // Then run every 24 hours
  const interval = setInterval(() => {
    runCleanup().catch(err =>
      console.error("[CleanupWorker] Scheduled run failed:", err)
    );
  }, INTERVAL_MS);

  // Prevent interval from blocking Node.js process shutdown
  if (interval.unref) {
    interval.unref();
  }

  console.log("[CleanupWorker] Started — will run every 24 hours.");
}
