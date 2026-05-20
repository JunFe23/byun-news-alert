import { isDeferredTeam } from "@/lib/filterSort";
import type { FaTeam } from "@/lib/types";

export function resolveTeamLogoSrc(
  logoPath: string | null | undefined,
): string | null {
  if (!logoPath || !logoPath.trim()) {
    return null;
  }
  const path = logoPath.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function shouldShowLogoPlaceholder(team: FaTeam | null | undefined): boolean {
  if (!team) return true;
  if (isDeferredTeam(team)) return true;
  return !resolveTeamLogoSrc(team.logo_path);
}
