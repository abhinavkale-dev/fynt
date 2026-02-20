import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";
const editorialNew = localFont({
    src: "../public/pp-editorial-new-regular.otf",
    variable: "--font-serif",
    display: "swap",
});
export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title: "Fynt",
    description: "Create and automate workflows with Fynt",
    icons: {
        icon: { url: "/icon.svg", type: "image/svg+xml" },
    },
    openGraph: {
        title: "Fynt",
        description: "Create and automate workflows with Fynt",
        images: [
            {
                url: "/og/fynt-og.webp",
                width: 1204,
                height: 600,
                type: "image/webp",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Fynt",
        description: "Create and automate workflows with Fynt",
        images: ["/og/fynt-og.webp"],
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
      <body className={`${editorialNew.variable} antialiased`} style={fallbackFontVars} suppressHydrationWarning>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>);
}
