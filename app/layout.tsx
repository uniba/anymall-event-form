import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { Suspense } from "react";
import { GtmPageView } from "@/components/gtm-page-view";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

const siteTitle =
  "AnyMall 獣医師監修 愛犬・愛猫のためのウェルネスランチイベント抽選応募受付中！";
const siteDescription =
  "愛犬との暮らしがもっと豊かになる、体験型イベント。食事・健康・ライフスタイルを、専門家と一緒に楽しく学びませんか。";
const siteUrl = "https://event.anymall.jp";
const ogImageUrl = `${siteUrl}/images/ogimage.png`;

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "AnyMall",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable} ${notoSerifJP.variable}`}
    >
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body>
        <Suspense fallback={null}>
          <GtmPageView />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
