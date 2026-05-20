"use client";

import { useState } from "react";
import {
  resolveTeamLogoSrc,
  shouldShowLogoPlaceholder,
} from "@/lib/teamLogo";
import type { FaTeam } from "@/lib/types";

const LOGO_PX = { sm: 20, md: 24 } as const;

type TeamLabelProps = {
  team?: FaTeam | null;
  size?: keyof typeof LOGO_PX;
  strong?: boolean;
  /** false면 로고/플레이스홀더 없이 팀명만 */
  showLogo?: boolean;
};

export default function TeamLabel({
  team,
  size = "sm",
  strong = false,
  showLogo = true,
}: TeamLabelProps) {
  if (!team) {
    return <span className="text-brand-muted">—</span>;
  }

  const label = team.short_name || team.team_name;
  const px = LOGO_PX[size];
  const [imageFailed, setImageFailed] = useState(false);

  const logoSrc = resolveTeamLogoSrc(team.logo_path);
  const usePlaceholder =
    showLogo && (shouldShowLogoPlaceholder(team) || imageFailed);
  const showImage = showLogo && logoSrc && !usePlaceholder && !imageFailed;

  const nameClass = strong
    ? "font-semibold text-[#1a1a1a]"
    : "font-medium text-brand-muted";

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      {showLogo ? (
        showImage ? (
          <span
            className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-brand-border/60"
            style={{ width: px, height: px }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt=""
              width={px}
              height={px}
              className="h-full w-full object-contain"
              onError={() => setImageFailed(true)}
            />
          </span>
        ) : (
          <LogoPlaceholder px={px} />
        )
      ) : null}
      <span className={nameClass}>{label}</span>
    </span>
  );
}

function LogoPlaceholder({ px }: { px: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#eceae7] text-[9px] font-semibold text-[#9a9590] ring-1 ring-brand-border/50"
      style={{ width: px, height: px }}
      aria-hidden
    >
      −
    </span>
  );
}
