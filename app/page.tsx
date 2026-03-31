import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="surface-panel rounded-[32px] px-5 py-8 sm:px-7 sm:py-10">
        <div className="space-y-4">
          <p className="text-xs section-kicker">Xuanjian Archive</p>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-stone-100 sm:text-4xl">
              玄鉴仙族社区
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[#c0c7bc]">
              聚合世界观资料、讨论互动与人物战力排行，围绕玄鉴仙族的设定与剧情持续沉淀内容。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/world"
              className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-5 py-2.5 text-sm font-medium text-[#d3dbd7] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white"
            >
              进入世界观
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center rounded-full bg-[rgba(177,145,87,0.92)] px-5 py-2.5 text-sm font-medium text-[#171208] transition hover:bg-[#dbc189]"
            >
              进入讨论区
            </Link>
            <Link
              href="/rank"
              className="inline-flex items-center rounded-full border border-[rgba(126,165,154,0.22)] bg-[rgba(126,165,154,0.08)] px-5 py-2.5 text-sm font-medium text-[#d3dbd7] transition hover:border-[rgba(177,145,87,0.22)] hover:text-white"
            >
              进入战力榜
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
