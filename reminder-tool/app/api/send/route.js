import { kv } from "@vercel/kv";
import { sendTemplateMessage } from "../../lib/whatsapp";

const JOBS_KEY = "reminder_jobs";

export async function POST(req) {
  const body = await req.json();
  const { mode, contacts, templateName, languageCode, sendAt } = body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return Response.json({ error: "No contacts provided." }, { status: 400 });
  }
  if (!templateName) {
    return Response.json({ error: "templateName is required." }, { status: 400 });
  }

  // SCHEDULE: store as pending jobs, the cron route sends them later.
  if (mode === "schedule") {
    if (!sendAt) {
      return Response.json({ error: "sendAt is required for scheduling." }, { status: 400 });
    }
    const existing = (await kv.get(JOBS_KEY)) || [];
    const newJobs = contacts.map((c, i) => ({
      id: `${Date.now()}-${i}`,
      to: c.phone,
      params: c.params,
      templateName,
      languageCode: languageCode || "en_US",
      sendAt, // ISO timestamp
      status: "pending",
      createdAt: new Date().toISOString(),
    }));
    await kv.set(JOBS_KEY, [...existing, ...newJobs]);
    return Response.json({ scheduled: newJobs.length });
  }

  // SEND NOW: fire immediately, one by one, collect results.
  const results = [];
  for (const c of contacts) {
    try {
      await sendTemplateMessage({
        to: c.phone,
        templateName,
        languageCode: languageCode || "en_US",
        params: c.params,
      });
      results.push({ phone: c.phone, ok: true });
    } catch (err) {
      results.push({ phone: c.phone, ok: false, error: err.message });
    }
    // small delay to stay comfortably under Meta's rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  return Response.json({ sent, failed });
}
