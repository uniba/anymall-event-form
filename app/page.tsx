import Image from "next/image";
import { SlotState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/landing/section-heading";
import { EventSection } from "@/components/landing/event-section";
import { Icon } from "@/components/icon";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { VenueGallery } from "@/components/landing/venue-gallery";

export default async function HomePage() {
  const slots = await prisma.slot.findMany({
    include: {
      venue: {
        select: { name: true, address: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const acceptingSlots = slots
    .filter((s) => s.state === SlotState.ACCEPTING_APPLICATIONS)
    .map((s) => ({
      ...s,
      applicationBegin: s.applicationBegin.toISOString(),
      applicationDeadline: s.applicationDeadline.toISOString(),
      lotteryResultTime: s.lotteryResultTime.toISOString(),
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

  const comingSlots = slots
    .filter((s) => s.state === SlotState.APPLICATIONS_CLOSED)
    .map((s) => ({
      ...s,
      applicationBegin: s.applicationBegin.toISOString(),
      applicationDeadline: s.applicationDeadline.toISOString(),
      lotteryResultTime: s.lotteryResultTime.toISOString(),
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

  const venues = await prisma.venue.findMany();

  return (
    <main className="flex flex-col min-h-screen bg-white font-sans">
      <Header />

      <div className="flex flex-col flex-1">
        {/* Hero */}
        <section className="relative h-[665px] overflow-hidden md:h-[720px]">
          <div className="absolute inset-0">
            <Image
              src="/images/hero.png"
              alt="愛犬と過ごす特別なひととき"
              fill
              className="object-cover pb-44 md:pb-0"
              priority
            />
          </div>
          <div
            className="md:hidden absolute left-0 bottom-0 h-[390px] w-full"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, #eef2e6 30%)",
            }}
          />

          <div className="absolute left-0 bottom-0 w-full flex flex-col items-center pb-24 md:pb-0">
            <div className="flex flex-col md:block items-center gap-4 px-4 w-[95%] md:max-w-7xl md:pb-52 md:px-0">
              <h1 className="text-center md:text-right font-serif text-[32px] leading-[48px] text-brand-green-accent sm:text-[32px] md:text-[48px] md:leading-[56px] md:leading-[150%]">
                <span className="inline-block bg-white pt-0.5 pb-1 px-2 md:px-4 md:py-3">
                  愛犬と過ごす、
                </span>
                <br />
                <span className="inline-block bg-white pt-0.5 pb-1 px-2 md:px-4 md:py-3 md:ml-10">
                  特別なひととき。
                </span>
              </h1>
              <p className="text-center md:text-right text-[14px] leading-6 text-warm-700 md:text-base md:leading-8 md:mt-8">
                <span className="md:inline-block md:bg-white md:pt-0.5 md:pb-1 md:px-2">
                  獣医師監修の特別な少人数制イベントへ、抽選でご招待いたします。
                </span>
                <br />
                <span className="md:inline-block md:bg-white md:pt-0.5 md:pb-1 md:px-2">
                  ランチを楽しみながら、専門家と一緒に学んでみませんか？
                </span>
                <br />
              </p>
            </div>
            <div className="absolute -top-[64px] left-6 md:top-0 md:left-[80px] flex items-center justify-center size-[96px] md:size-[120px] rotate-[-7deg] bounceMicro">
              <div className="relative z-10 text-center text-white text-lg md:text-[24px] text-shadow-sm font-black leading-[120%]">
                応募・参加
                <br />
                無料
              </div>
              <ul className="absolute size-full">
                <li className="absolute size-full bg-[#FF9D00] rounded-[24px] "></li>
                <li className="absolute size-full bg-[#FF9D00] rounded-[24px] rotate-[30deg]"></li>
                <li className="absolute size-full bg-[#FF9D00] rounded-[24px] rotate-[60deg]"></li>
                <li className="absolute size-full bg-[#FF9D00] rounded-[24px] rotate-[90deg]"></li>
              </ul>
            </div>
          </div>

          <a
            href="#events"
            className="absolute left-1/2 bottom-[24px] -translate-x-1/2 rounded-full bg-brand-green px-8 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-brand-green-dark md:bottom-[30px] fadeIn whitespace-nowrap"
            // style={{ animationDuration: "3000ms" }}
          >
            抽選に応募する ↓
          </a>
        </section>

        {/* Theme */}
        <section className="px-4 py-8 md:px-8 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <SectionHeading
              sub="Theme"
              label="ペットとの暮らしを、もっと楽しむために。"
            />

            <div className="mx-auto max-w-2xl text-base leading-7 text-warm-600 md:text-center">
              <Image
                src="/images/theme-life.jpg"
                alt="ペットとの暮らしを、もっと楽しむために。"
                width={512}
                height={512}
              />
            </div>
            <div className="mx-auto max-w-3xl text-base leading-7 text-warm-600 md:text-center">
              <p>
                獣医師監修のもと、ペットの食事・健康・生活に関するテーマを取り上げた少人数制イベントを開催します。
              </p>
              <p>
                ランチを楽しみながら、栄養学、手作りフード、犬種別の健康管理、長寿の秘訣など、
                愛犬との暮らしに役立つ知識やヒントを学べる特別な時間です。
                <br />
                抽選で、各日程20〜25組様を無料でご招待。わんちゃんやねこちゃん、ご家族と一緒にご参加いただけます。
              </p>
            </div>

            <h3 className="mx-auto max-w-3xl text-center font-serif text-xl font-semibold leading-normal text-warm-800">
              実施予定テーマ
            </h3>

            <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
              {[
                {
                  icon: "Bone" as const,
                  text: "愛犬にあう食事の考え方/付き合い方",
                },
                {
                  icon: "Utensils" as const,
                  text: "はじめての手作りごはんの作り方",
                },
                {
                  icon: "Activity" as const,
                  text: "犬種ごとに起きやすい健康トラブル",
                },
                {
                  icon: "Heart" as const,
                  text: "愛犬の長生きのためにできること",
                },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-warm-100">
                    <Icon
                      className="text-warm-accent"
                      name={item.icon}
                      size="24"
                    />
                  </div>
                  <p className="font-serif text-[17px] font-semibold text-warm-800">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Venue */}
        <section className="bg-warm-50 px-4 py-8 md:px-8 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <SectionHeading sub="Venue" label="会場" />

            <div className="relative grid gap-6 md:grid-cols-2">
              {[
                {
                  name: "inumo 芝公園 by ヴィラフォンテーヌ",
                  url: "https://www.hvf.jp/inumo-shibakoen/",
                  description:
                    "inumo 芝公園 by ヴィラフォンテーヌは、​都心で​愛犬と​一緒に​快適な​滞在を​楽しめる​ドッグファーストな​ホテルです。​館内は​どこでも​愛犬と​過ごせる​設計で、​屋内ドッグランや​グルーミング、​お預かりサービス、​レストランなども​充実。​愛犬との​時間を​心地よく​彩る、​上質な​宿泊体験を​提供します",
                  image:
                    "/images/venue/inumo_shiba_villa/venue-shiba-villa-1.jpg",
                  slides: [
                    "/images/venue/inumo_shiba_villa/venue-shiba-villa-2.jpg",
                    "/images/venue/inumo_shiba_villa/venue-shiba-villa-3.jpg",
                    "/images/venue/inumo_shiba_villa/venue-shiba-villa-4.jpg",
                  ],
                },
                {
                  name: "Dyplus 大阪北",
                  url: "https://osakakita.dyplus-pet.com/",
                  description:
                    "Dyplus 大阪北は、​ペットと​飼い主の​健康的な​暮らしを​支える​複合施設です。​未病・予防を​目的とした​メディカルチェックに​加え、​ホテルや​預かり保育、​しつけ相談などを​通じて、​ヘルスケアと​ライフスタイルの​両面から​サポート。​専門スタッフが​連携し、​“ペットとの​暮らしに​プラス”を​届けます。​",
                  image: "/images/venue/dyplus_osaka_kita/venue-dyplus-1.jpg",
                  slides: [
                    "/images/venue/dyplus_osaka_kita/venue-dyplus-2.jpg",
                    "/images/venue/dyplus_osaka_kita/venue-dyplus-3.jpg",
                    "/images/venue/dyplus_osaka_kita/venue-dyplus-4.jpg",
                  ],
                },
              ].map((venue) => (
                <div
                  key={venue.name}
                  className="relative z-20 overflow-hidden rounded-2xl border border-warm-200 bg-white"
                >
                  <div className="relative h-[242px] bg-warm-300">
                    <Image
                      src={venue.image}
                      alt={venue.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-2.5">
                      <h3 className="font-serif text-[22px] font-bold text-warm-900">
                        <a
                          href={venue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {venue.name}
                        </a>
                      </h3>
                    </div>
                    <p className="text-base leading-6 text-warm-500">
                      {venue.description}
                    </p>
                    <VenueGallery
                      images={venue.slides}
                      venueName={venue.name}
                    />
                  </div>
                </div>
              ))}
              <div className="absolute z-10 -top-24 -left-1 md:-left-10 -rotate-30">
                <Image
                  // className="slideIn"
                  src="/images/fig-dog.jpg"
                  alt=""
                  width={168}
                  height={214}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Events */}
        <EventSection
          acceptingSlots={acceptingSlots}
          comingSlots={comingSlots}
        />

        {/* Speaker */}
        <section className="bg-brand-green-bg px-4 py-8 md:px-8 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <SectionHeading sub="Instructor" label="担当講師" />

            <div className="grid gap-12 md:grid-cols-2 md:gap-8">
              {[
                {
                  name: "中村 篤史",
                  title: "獣医師 / A'alda動物病院グループ総院長",
                  bio: "A'aldaの動物病院グループ総院長として国内最大級の動物病院グループを統括。獣医療の現場と経営の両面から、ペットと飼い主の未来を見据えたビジョンを発信しています。",
                  image: "/images/instructor/instructor-nakamura.jpg",
                },
                {
                  name: "今井 まなみ",
                  title: "獣医師 / 愛犬ごはん研究家",
                  bio: "大手ペットフードメーカーで栄養管理に携わり、犬のごはんや栄養について発信しています。手作りごはんやトッピングを中心に、日常に取り入れやすい食事の考え方をお伝えしています。",
                  image: "/images/instructor/instructor-manami.jpg",
                },
              ].map((speaker) => (
                <div
                  key={speaker.name}
                  className="flex flex-col items-center rounded-2xl bg-white p-8"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative size-[200px] md:size-[160px]">
                      <Image
                        src={speaker.image}
                        alt={speaker.name}
                        fill
                        className="rounded-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full ring-2 ring-brand-green-light ring-offset-2" />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center font-bold">
                      <p className="text-2xl text-warm-900">{speaker.name}</p>
                      <p className="text-lg text-brand-green-dark">
                        {speaker.title}
                      </p>
                    </div>
                    <p className="whitespace-pre-line text-base leading-6 text-warm-900">
                      {speaker.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner */}
        <section className="relative bg-white pt-16 pb-48 overflow-hidden">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
            {/* <SectionHeading sub="Partner" label="パートナー" />
            <div className="relative z-30 flex flex-col items-center gap-16 md:flex-row md:justify-center md:gap-16">
              <Image
                src="/images/partner-diners.png"
                alt="Diners Club International"
                width={132}
                height={96}
              />
              <Image
                src="/images/partner-fpc.png"
                alt="FPC"
                width={90}
                height={80}
              />
              <Image
                src="/images/partner-panasonic.png"
                alt="Panasonic"
                width={241}
                height={37}
              />
            </div> */}
            <Image
              className="absolute z-10 left-1/2 -bottom-40 md:-bottom-36 -translate-x-1/2"
              src="/images/fig-bear.jpg"
              alt=""
              width={268}
              height={320}
            />
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}
