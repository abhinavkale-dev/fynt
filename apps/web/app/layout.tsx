import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { Analytics } from "@vercel/analytics/next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://fynt.in"
    : "http://localhost:3000");
const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
const socialImagePath = "/og/fynt-og.webp";
const socialImageUrl = `${normalizedSiteUrl}${socialImagePath}`;

const siteTitle = "Fynt | AI Workflow Automation Platform for Modern Teams";
const siteDescription =
  "Build, run, and monitor AI-powered workflows that connect your apps, trigger actions, and keep operations moving with templates you can launch in minutes.";

const editorialNew = localFont({
    src: "../public/pp-editorial-new-regular.otf",
    variable: "--font-serif",
    display: "swap",
});
export const metadata: Metadata = {
    metadataBase: new URL(normalizedSiteUrl),
    title: siteTitle,
    description: siteDescription,
    icons: {
        icon: { url: "/icon.svg", type: "image/svg+xml" },
    },
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: siteTitle,
        description: siteDescription,
        url: "/",
        siteName: "Fynt",
        type: "website",
        images: [
            {
                url: socialImageUrl,
                width: 1204,
                height: 600,
                type: "image/webp",
                alt: "Automate workflows faster with Fynt. Start free at fynt.in",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteTitle,
        description: siteDescription,
        site: "@Abhinavstwt",
        creator: "@Abhinavstwt",
        images: [socialImageUrl],
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    const fallbackFontVars = {
        "--font-geist-sans": 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        "--font-geist-mono": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        "--font-inter": 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    } as React.CSSProperties;
    return (<html lang="en">
      <body className={`${editorialNew.variable} antialiased`} style={fallbackFontVars}>
        <TRPCProvider>
          {children}
        </TRPCProvider>
        <Analytics />
      </body>
    </html>);
}
