import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandAssetProps = {
  className?: string;
  priority?: boolean;
};

export function FarmaVerseIcon({ className, priority = false }: BrandAssetProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn("size-10", className)}
      height={48}
      loading={priority ? "eager" : "lazy"}
      src="/brand/farmaverse-icon.svg"
      unoptimized
      width={48}
    />
  );
}

export function FarmaVerseLogo({ className, priority = false }: BrandAssetProps) {
  return (
    <Image
      alt="FarmaVerse"
      className={cn("h-auto w-48", className)}
      fetchPriority={priority ? "high" : "auto"}
      height={256}
      loading="eager"
      src="/brand/farmaverse-logo.svg"
      unoptimized
      width={920}
    />
  );
}
