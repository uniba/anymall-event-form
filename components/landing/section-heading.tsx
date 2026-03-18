type SectionHeadingProps = {
  sub: string;
  label: string;
};

export function SectionHeading({ sub, label }: SectionHeadingProps) {
  return (
    <div className="relative z-30 flex flex-col items-center gap-2">
      <p className="font-serif text-xs font-semibold uppercase tracking-[4px] text-brand-olive">
        {sub}
      </p>
      <div className="flex flex-col items-center gap-3">
        <h2 className="max-w-[343px] text-center font-serif text-[28px] font-semibold leading-normal text-warm-800 md:max-w-none md:text-[32px]">
          {label}
        </h2>
        <div className="h-px w-[60px] bg-brand-green-light" />
      </div>
    </div>
  );
}
