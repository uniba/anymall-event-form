import Image from "next/image";
import { Icon } from "@/components/icon";

export default async function Footer() {
  return (
    <footer className="relative z-30 bg-warm-800 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <Image
          src="/images/logo-white.png"
          alt="AnyMall"
          width={109}
          height={38}
        />
        <div className="w-full border-t border-warm-600 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-6">
              <nav className="flex flex-col gap-4 text-xs font-medium text-white md:flex-row md:gap-6">
                <a href="#">利用規約</a>
                <a href="#">プライバシーポリシー</a>
                <a href="#">特定商取引法に基づく表示</a>
                <a href="#">お問い合わせ</a>
              </nav>
            </div>
            <div className="flex flex-col md:flex-row gap-8 md:gap-4">
              <div className="flex items-center gap-4">
                <a href="#" aria-label="YouTube" className="text-white">
                  <Icon name="Youtube" size="16" />
                </a>
                <a href="#" aria-label="Facebook" className="text-white">
                  <Icon name="Facebook" size="16" />
                </a>
                <a href="#" aria-label="Website" className="text-white">
                  <Icon name="Globe" size="16" />
                </a>
              </div>
              <p className="text-[11px] text-white">
                © 2026 AnyMall. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
