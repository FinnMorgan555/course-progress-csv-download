import { infrai } from "./infrai_storage.ts";

type LearnerProgress = {
  learner: string;
  course: string;
  completedLessons: number;
  assignedLessons: number;
};

const BUCKET = "learning-report-exports";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function progressCsv(rows: LearnerProgress[]): string {
  const header = "learner,course,completed_lessons,assigned_lessons";
  const entries = rows.map((row) => [
    csvCell(row.learner),
    csvCell(row.course),
    csvCell(row.completedLessons),
    csvCell(row.assignedLessons),
  ].join(","));
  return [header, ...entries].join("\n");
}

async function exportCourseReport(): Promise<void> {
  const reportDate = "2026-07-31";
  const key = `course-progress/${reportDate}.csv`;
  const csv = progressCsv([
    { learner: "Asha Patel", course: "Fraud Review Foundations", completedLessons: 8, assignedLessons: 8 },
    { learner: "Noah Kim", course: "Fraud Review Foundations", completedLessons: 6, assignedLessons: 8 },
  ]);

  // Create the export bucket as part of the normal setup before object operations.
  await infrai.storage.bucket.create({ bucket: BUCKET });

  // A stable key means a retried PUT replaces this report rather than creating another export.
  await infrai.storage.object.put(BUCKET, key, {
    data_base64: Buffer.from(csv, "utf8").toString("base64"),
  });

  const request = { op: "get" as const, bucket: BUCKET, key, expires_in: 900 };
  const signed = await infrai.storage.object.presign(BUCKET, key, request);
  console.log(`Download the course-progress CSV: ${signed.url}`);
}

exportCourseReport().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
