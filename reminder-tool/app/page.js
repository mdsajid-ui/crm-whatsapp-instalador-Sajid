"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

const card = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
};
const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0F172A",
  color: "#F1F5F9",
  marginTop: 4,
};
const button = (bg) => ({
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: bg,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
});

export default function Home() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [phoneCol, setPhoneCol] = useState("");
  const [nameCol, setNameCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [dueDateCol, setDueDateCol] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [scheduleAt, setScheduleAt] = useState("");
  const [status, setStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    refreshJobs();
  }, []);

  async function refreshJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      /* ignore if KV not configured yet */
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data);
        setColumns(result.meta.fields || []);
      },
    });
  }

  function buildContacts() {
    return rows
      .filter((r) => r[phoneCol])
      .map((r) => ({
        phone: r[phoneCol],
        params: [r[nameCol] || "", r[amountCol] || "", r[dueDateCol] || ""],
      }));
  }

  async function handleSubmit(mode) {
    setStatus(null);
    if (!phoneCol || !templateName) {
      setStatus({ error: "Pick a phone column and enter a template name first." });
      return;
    }
    if (mode === "schedule" && !scheduleAt) {
      setStatus({ error: "Pick a date/time to schedule for." });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          contacts: buildContacts(),
          templateName,
          languageCode,
          sendAt: mode === "schedule" ? new Date(scheduleAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      setStatus(res.ok ? { ok: true, data } : { error: data.error || "Something went wrong." });
      refreshJobs();
    } catch (err) {
      setStatus({ error: err.message });
    }
    setSending(false);
  }

  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>WhatsApp Payment Reminders</h1>
      <p style={{ color: "#94A3B8", marginTop: 0, marginBottom: 24 }}>
        Upload today's fee-due report, map the columns, and send or schedule reminders
        through your approved WhatsApp template.
      </p>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>1. Upload CSV</h3>
        <input type="file" accept=".csv" onChange={handleFile} />
        {rows.length > 0 && (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>{rows.length} rows loaded.</p>
        )}
      </div>

      {columns.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>2. Map columns</h3>
          {[
            ["Phone number column", phoneCol, setPhoneCol],
            ["Student name column", nameCol, setNameCol],
            ["Due amount column", amountCol, setAmountCol],
            ["Due date column", dueDateCol, setDueDateCol],
          ].map(([label, val, setter]) => (
            <label key={label} style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
              {label}
              <select style={input} value={val} onChange={(e) => setter(e.target.value)}>
                <option value="">-- select --</option>
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          ))}
          <p style={{ color: "#94A3B8", fontSize: 12 }}>
            These fill your template's body variables in order: {"{{1}}"}=name, {"{{2}}"}=amount, {"{{3}}"}=due date.
          </p>
        </div>
      )}

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>3. Template &amp; send</h3>
        <label style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
          Approved template name (from Meta Business Manager)
          <input style={input} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. payment_reminder" />
        </label>
        <label style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
          Template language code
          <input style={input} value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} placeholder="en_US" />
        </label>
        <label style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
          Schedule for (leave blank to send immediately)
          <input style={input} type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button style={button("#10B981")} disabled={sending} onClick={() => handleSubmit("now")}>
            {sending ? "Sending..." : "Send Now"}
          </button>
          <button style={button("#2563EB")} disabled={sending} onClick={() => handleSubmit("schedule")}>
            {sending ? "Scheduling..." : "Schedule"}
          </button>
        </div>

        {status?.error && <p style={{ color: "#F87171", marginTop: 14 }}>{status.error}</p>}
        {status?.ok && status.data?.sent !== undefined && (
          <p style={{ color: "#34D399", marginTop: 14 }}>
            Sent {status.data.sent} messages{status.data.failed?.length ? `, ${status.data.failed.length} failed` : ""}.
          </p>
        )}
        {status?.ok && status.data?.scheduled !== undefined && (
          <p style={{ color: "#34D399", marginTop: 14 }}>Scheduled {status.data.scheduled} messages.</p>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Recent jobs</h3>
        {jobs.length === 0 && <p style={{ color: "#94A3B8", fontSize: 13 }}>Nothing scheduled or sent yet.</p>}
        {jobs.map((j) => (
          <div key={j.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155", fontSize: 13 }}>
            <span>{j.to}</span>
            <span style={{ color: "#94A3B8" }}>{new Date(j.sendAt).toLocaleString()}</span>
            <span style={{ color: j.status === "sent" ? "#34D399" : j.status === "failed" ? "#F87171" : "#FBBF24" }}>
              {j.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
