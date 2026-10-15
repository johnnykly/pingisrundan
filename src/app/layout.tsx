import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { DEFAULT_LANG, dictionaries, isLang, LANG_COOKIE } from "@/i18n";
import { LangProvider } from "@/i18n/provider";
import { Shell } from "@/components/shell";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const sv = dictionaries.sv;

export const metadata: Metadata = {
  title: { default: sv.app.name, template: `%s | ${sv.app.name}` },
  description: sv.app.description,
  applicationName: sv.app.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: sv.app.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171617" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value;
  const lang = isLang(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html lang={lang} className={GeistSans.variable}>
      <body className="min-h-[100dvh] antialiased">
        <LangProvider initial={lang}>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
