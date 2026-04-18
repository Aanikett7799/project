import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Lumina — Student Intelligence Dashboard",
  description: "Your all-in-one student productivity OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-outfit`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(224 71% 6%)",
              border: "1px solid hsl(216 34% 17%)",
              color: "hsl(213 31% 91%)",
              fontFamily: "Outfit, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
