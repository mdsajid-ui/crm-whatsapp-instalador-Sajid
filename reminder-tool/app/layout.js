export const metadata = {
  title: "WhatsApp Payment Reminders",
  description: "Upload a student list, send or schedule WhatsApp payment reminders via Meta Cloud API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0F172A", color: "#F1F5F9" }}>
        {children}
      </body>
    </html>
  );
}
