import { kv } from "@vercel/kv";
import { sendTemplateMessage } from "../../lib/whatsapp";

const JOBS_KEY = "reminder_jobs";

// Vercel Cron calls this on a schedule (see vercel.json).
// It's protected by CRON_SECRET so randoms on the internet can't trigger sends.
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const jobs = (await kv.get(JOBS_KEY)) || [];
  const now = Date.now();
  let sentCount = 0;
  let failedCount = 0;

  const updated = await Promise.all(
    jobs.map(async (job) => {
      if (job.status !== "pending" || new Date(job.sendAt).getTime() > now) {
        return job; // not due yet, or already handled
      }
      try {
        await sendTemplateMessage({
          to: job.to,
          templateName: job.templateName,
          languageCode: job.languageCode,
          params: job.params,
        });
        sentCount++;
        return { ...job, status: "sent", sentAt: new Date().toISOString() };
      } catch (err) {
        failedCount++;
        return { ...job, status: "failed", error: err.message };
      }
    })
  );

  await kv.set(JOBS_KEY, updated);

  return Response.json({ checked: jobs.length, sent: sentCount, failed: failedCount });
}
