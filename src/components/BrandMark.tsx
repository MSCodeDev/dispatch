import Image from "next/image";

export function BrandMark({
  className = "",
  iconClassName = "",
  compact = false,
}: {
  className?: string;
  iconClassName?: string;
  compact?: boolean;
}) {
  const size = compact ? 40 : 48;
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/logo.png"
        alt="Dispatch"
        width={size}
        height={size}
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} object-contain ${iconClassName}`}
        priority
      />
    </span>
  );
}
