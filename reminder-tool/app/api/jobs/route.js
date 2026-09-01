export const dynamic = "force-dynamic";

import { kv } from "@vercel/kv";

const JOBS_KEY = "reminder_jobs";

export async function GET() {
  const jobs = (await kv.get(JOBS_KEY)) || [];
  const sorted = [...jobs].sort((a, b) => new Date(b.sendAt) - new Date(a.sendAt));
  return Response.json({ jobs: sorted.slice(0, 100) });
}
