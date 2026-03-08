import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Grievance Router & SLA Engine | Public Service Accountability",
  description: "AI-Powered Grievance Router and SLA Accountability for Public Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#000000!important;color:#c0c0c0!important;min-height:100vh!important}` }} />
      </head>
      <body className="min-h-screen bg-black text-slate-300 antialiased" style={{ backgroundColor: "#000000" }} suppressHydrationWarning>
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", color: "#c0c0c0" }}>
            GrievanceRouter — Please enable JavaScript.
          </div>
        </noscript>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
