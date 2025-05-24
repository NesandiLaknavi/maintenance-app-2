import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import LoadingScreen from "@/components/LoadingScreen";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maintenance App",
  description: "Industrial Maintenance Management System",
  icons: {
    icon: '/logo/logo.jpeg',
    apple: '/logo/logo.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            {children}
          </Suspense>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
