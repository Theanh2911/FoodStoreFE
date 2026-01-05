import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Store Dashboard",
  description: "Mobile-first dashboard for managing your food store business",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Food Store',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="mobile-scroll">
      <head>
        {/* Apple Web App meta tags are handled by metadata.appleWebApp */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased mobile-scroll safe-area-top safe-area-bottom`}
      >
        <AuthProvider>
          <ConfirmDialogProvider>
            {children}
            <Toaster />
          </ConfirmDialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
