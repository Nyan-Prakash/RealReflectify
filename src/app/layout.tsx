import type { Metadata } from "next";
import { Roboto_Mono, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "sonner";

const robotoMono = Roboto_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Reflectify — AI-Powered Journaling",
  description: "Transform your thoughts into structured knowledge with AI-powered journaling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${robotoMono.variable} ${inter.className} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#2c2e31',
              border: '1px solid #44464a',
              color: '#d1d0c5',
            },
          }}
        />
      </body>
    </html>
  );
}
