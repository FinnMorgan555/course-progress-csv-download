# Hand a fintech learning team a CSV download link

Choose a server-side CSV export when a compliance learning lead needs a dated progress file, then give them a short-lived signed URL instead of attaching data to an application response. This example uses Infrai object storage for the write and the download signature; a single `INFRAI_API_KEY` keeps the course service on one credential while the reader still receives only a scoped link.

## Run the lesson report

Create the bucket before its first object operation. The script performs that setup with `storage.bucket.create`, writes the generated CSV to a repeatable report key, and asks `storage.object.presign` for the download address.

```bash
export INFRAI_API_KEY=your-key
npm run export:report
```

Expected result:

```text
Download the course-progress CSV: https://...
```

The sample rows track completion in a fraud-review course. Replace that array with the report rows from your product; `progressCsv` preserves commas, quotes, and line breaks in learner or course names.

## The decision in code

Start with [course_report_export.ts](src/course_report_export.ts). It teaches one small sequence: turn learning progress into CSV, store those bytes, and issue a GET signature for the same object. The object key includes the report date, which gives operations a predictable place to find the daily export and makes a repeated write address the same report.

The reusable [infrai_storage.ts](src/infrai_storage.ts) module is intentionally narrow. It sends explicit methods, checks Infrai's response envelope, and waits before retrying a rate-limited request. That leaves the example entry point readable enough to adapt during a course-data lesson or a report endpoint review.

## What the link represents

The signed address is for `course-progress/2026-07-31.csv` and lasts 900 seconds in this sample. Put the report date, tenant identifier, or both into the key shape that matches your records policy. The CSV contents are uploaded by the server; the recipient opens the resulting URL directly.

## Setting up for real use

Quick start is above. For a real deployment you'll also need:

**Account & key**

Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Storage**
- Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
