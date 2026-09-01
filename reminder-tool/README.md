# WhatsApp Payment Reminders

A standalone tool (separate from `crm/`) for sending fee/payment reminder
messages to students over WhatsApp, using your Meta WhatsApp Business
Cloud API app. Upload a CSV each time — no database of students needed.

## Important: you need an approved WhatsApp template

Meta does not allow free-form business-initiated messages. Before this
tool can send anything, you must create and get approval for a **message
template** in Meta Business Manager (WhatsApp Manager > Message Templates).

Example template body:

```
Hi {{1}}, this is a reminder that your fee payment of {{2}} is due on {{3}}.
Please complete your payment at the earliest. — DV Analytics
```

Approval usually takes a few minutes to a few hours. The template's exact
name (e.g. `payment_reminder`) is what you type into this tool.

## Deploying

1. Push this repo to GitHub (already done if you're reading this from
   `mdsajid-ui/crm-whatsapp-instalador-Sajid`).
2. In Vercel: **New Project → Import this repo**, but set **Root
   Directory** to `reminder-tool` (this is a separate app from the
   installer landing page and from `crm/`).
3. In the new Vercel project → **Storage** tab → **Create Database → KV**.
   This auto-adds `KV_REST_API_URL` / `KV_REST_API_TOKEN` for you — needed
   for scheduling to persist between requests.
4. In **Settings → Environment Variables**, add:
   - `WHATSAPP_TOKEN` — from Meta Business Manager > WhatsApp > API Setup
   - `WHATSAPP_PHONE_NUMBER_ID` — same page
   - `CRON_SECRET` — any random string you make up (e.g. `openssl rand -hex 16`)
5. Deploy. The scheduled-sends cron runs automatically once a day at
   3:00 AM UTC / 8:30 AM IST (`vercel.json`), checking for any due
   reminders and sending them. This is a Vercel Hobby (free) plan limit —
   cron jobs on Hobby can only run once per day, so a reminder you
   schedule for, say, 2 PM will actually go out the next time the daily
   job runs, not at 2 PM exactly. Upgrading to Vercel Pro unlocks
   finer-grained cron schedules if you need exact-time sends.

## Using it

1. Open the deployed site.
2. Upload your CSV (needs at least a phone number column; ideally also
   name, amount due, and due date columns).
3. Map which column is which.
4. Enter your approved template name and language code.
5. Either **Send Now** or pick a date/time and **Schedule**.

Phone numbers should include the country code (e.g. `919876543210`) —
the tool strips any spaces, dashes, or `+` automatically.
