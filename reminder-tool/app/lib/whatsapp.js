// Thin wrapper around the Meta WhatsApp Cloud API.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

const GRAPH_VERSION = "v20.0";

export async function sendTemplateMessage({ to, templateName, languageCode, params }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error(
      "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID environment variables."
    );
  }

  const cleanTo = String(to).replace(/[^\d]/g, ""); // digits only, country code included

  const body = {
    messaging_product: "whatsapp",
    to: cleanTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode || "en_US" },
      components: [
        {
          type: "body",
          parameters: (params || []).map((p) => ({ type: "text", text: String(p) })),
        },
      ],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const reason = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(reason);
  }

  return data;
}
