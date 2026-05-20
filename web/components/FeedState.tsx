import FaRadarMark from "@/components/FaRadarMark";
import { USER_FACING_LOAD_ERROR } from "@/lib/userFacingError";

interface FeedStateProps {
  variant: "loading" | "empty" | "error";
  onRetry?: () => void;
}

export default function FeedState({ variant, onRetry }: FeedStateProps) {
  if (variant === "loading") {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-16 text-center shadow-card backdrop-blur-sm">
        <SpinnerLarge />
        <p className="mt-5 text-sm font-medium text-[#2a2a2a]">
          피드를 불러오는 중
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
          KBL FA 시장 뉴스를 가져오고 있습니다
        </p>
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-14 text-center shadow-card backdrop-blur-sm">
        <div className="flex justify-center">
          <FaRadarMark />
        </div>
        <p className="mt-5 text-sm font-medium text-[#2a2a2a]">
          아직 감지된 뉴스가 없습니다
        </p>
        <p className="mx-auto mt-2 max-w-[18rem] text-xs leading-[1.7] text-brand-muted">
          FA 시장 관련 기사가 수집되면
          <br />
          이곳에 최신순으로 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-brand-surface/95 px-6 py-12 text-center shadow-card backdrop-blur-sm">
      <p className="text-sm font-medium text-brand-primary">
        피드를 불러오지 못했습니다
      </p>
      <p className="mt-2 text-xs leading-relaxed text-brand-muted">
        {USER_FACING_LOAD_ERROR}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="mt-5 text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

function SpinnerLarge() {
  return (
    <span
      className="mx-auto inline-block h-7 w-7 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary"
      aria-hidden
    />
  );
}
