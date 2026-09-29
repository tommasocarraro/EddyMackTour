import type { Metadata } from "next";
import { Fraunces, Jost } from "next/font/google";
import "./globals.css";
import IntroLoader from "@/components/IntroLoader";

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

export const metadata: Metadata = {
  title: "Eddy Mack Tour — Portfolio",
  description: "Director & Filmmaker based in Venice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jost.variable}`}>
      <body>
        <IntroLoader />
        {children}
      </body>
    </html>
  );
}
