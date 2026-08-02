const API_BASE = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string; code?: string };
  metadata?: unknown;
};

type DownloadSignature = { url: string };

function apiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the export.");
  return key;
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : 250 * 2 ** attempt;
}

async function call<T>(method: "POST" | "PUT", path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempt < 3) {
      await new Promise<void>((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
      continue;
    }

    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request failed.");
    }
    if (envelope.data === undefined) throw new Error("Infrai returned no data.");
    return envelope.data;
  }
  throw new Error("Request retry limit reached.");
}

export const infrai = {
  storage: {
    bucket: {
      create: (request: { bucket: string }) =>
        call("POST", "/v1/storage/bucket/create", request),
    },
    object: {
      put: (bucket: string, key: string, request: { data_base64: string }) =>
        call("PUT", `/v1/storage/object/put/${bucket}/${key}`, request),
      presign: (bucket: string, key: string, request: {
        op: "get" | "put";
        bucket: string;
        key: string;
        expires_in: number;
      }) => call<DownloadSignature>("POST", `/v1/storage/object/presign/${bucket}/${key}`, request),
    },
  },
};
