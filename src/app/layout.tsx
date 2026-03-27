import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grassroots Legacy MMA",
  description:
    "Developmental amateur MMA — fighter registration, matchmaking, scoring & rankings",
  manifest: "/manifest.json",
  themeColor: "#d4a843",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GL MMA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
