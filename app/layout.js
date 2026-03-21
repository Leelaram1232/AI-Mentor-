import { Outfit } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/Auth/AuthProvider";
import ThemeProvider from "@/components/Layout/ThemeProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: "AI Career Explorer | Discover Your Path",
  description:
    "Discover your ideal career path with AI-powered insights, personalized skill assessments, and curated learning roadmaps.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.variable}>
        {/* Animated Background Mesh */}
        <div className="background-mesh">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <AuthProvider>
          <ThemeProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
