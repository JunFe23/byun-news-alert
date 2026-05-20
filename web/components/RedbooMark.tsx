import Image from "next/image";

interface RedbooMarkProps {
  size?: number;
  className?: string;
}

/** 헤더·빈 상태 등에 쓰는 작은 레드부 브랜드 마크 */
export default function RedbooMark({ size = 36, className = "" }: RedbooMarkProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-primary/5 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/redboo.png"
        alt=""
        width={size}
        height={size}
        className="h-[88%] w-[88%] object-contain mix-blend-multiply"
        priority={size >= 40}
      />
    </span>
  );
}
