import type { Metadata } from "next";
import { Fraunces, Jost, Saira } from "next/font/google";
import "./globals.css";
import IntroLoader, { introSeenScript } from "@/components/IntroLoader";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "500", "600"],
  style: ["normal", "italic"],
});

// Free Futura lookalike, used where Futura itself isn't installed
const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["400", "500"],
});

// Free Eurostile lookalike for the header name (Eurostile itself is a paid font)
const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Eddy Mack Tour — Portfolio",
  description: "Director & Filmmaker based in Venice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: introSeenScript may add data-intro-seen before hydration
    <html lang="en" className={`${fraunces.variable} ${jost.variable} ${saira.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: introSeenScript }} />
        <IntroLoader />
        {children}
      </body>
    </html>
  );
}
