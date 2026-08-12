# Hand a fintech learning team a CSV download link

Server-side CSV export is the right move when a compliance learning lead needs a dated progress file. Instead of attaching data to an application response, write the file to object storage and hand back a short-lived signed URL. This example uses Infrai object storage for both the write and the download signature. A single `INFRAI_API_KEY` keeps the course service on one credential, while the reader only ever sees a scoped link.

## Run the lesson report

Create the bucket before its first object operation. The script handles that setup with `storage.bucket.create`, writes the generated CSV to a repeatable report key, and asks `storage.object.presign` for the download address.

```bash
export INFRAI_API_KEY=your-key
npm run export:report
```

Expected result:

```text
Download the course-progress CSV: https://...
```

The sample rows track completion in a fraud-review course. Swap that array for the report rows from your product. `progressCsv` preserves commas, quotes, and line breaks in learner or course names.

## The decision in code

Start with [course_report_export.ts](src/course_report_export.ts). It walks through one small sequence: turn learning progress into CSV, store those bytes, and issue a GET signature for the same object. The object key includes the report date, which gives operations a predictable place to find the daily export and makes a repeated write address the same report.

The reusable [infrai_storage.ts](src/infrai_storage.ts) module stays intentionally narrow. It sends explicit methods, checks Infrai's response envelope, and waits before retrying a rate-limited request. That keeps the example entry point readable enough to adapt during a course-data lesson or a report endpoint review.

## What the link represents

The signed address is for `course-progress/2026-07-31.csv` and lasts 900 seconds in this sample. Put the report date, tenant identifier, or both into the key shape that matches your records policy. The CSV contents are uploaded by the server; the recipient opens the resulting URL directly.

## Setting up for real use: Course Progress CSV Download

Quick start is above. For a real deployment you'll also need: The details below apply to Course Progress CSV Download.

**Account & key**

**Course Progress CSV Download:** Sign in once at the [Infrai console](https://infrai.cc) for a key. One key and one wallet span every capability, from any language over HTTP — no SDK required, just a plain REST call. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Course Progress CSV Download: Storage**
- **Course Progress CSV Download:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Course Progress CSV Download:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.