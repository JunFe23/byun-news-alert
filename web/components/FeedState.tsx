import RedbooMark from "@/components/RedbooMark";

interface FeedStateProps {
  variant: "loading" | "empty" | "error";
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function FeedState({
  variant,
  errorMessage,
  onRetry,
}: FeedStateProps) {
  if (variant === "loading") {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-16 text-center shadow-card backdrop-blur-sm">
        <SpinnerLarge />
        <p className="mt-5 text-sm font-medium text-[#2a2a2a]">
          피드를 불러오는 중
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
          오늘도 새로고침 대신, 여기서 기다립니다
        </p>
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-brand-surface/95 px-6 py-14 text-center shadow-card backdrop-blur-sm">
        <div className="flex justify-center">
          <RedbooMark size={52} className="opacity-95" />
        </div>
        <p className="mt-5 text-sm font-medium text-[#2a2a2a]">
          아직 감지된 뉴스가 없습니다
        </p>
        <p className="mx-auto mt-2 max-w-[16rem] text-xs leading-[1.7] text-brand-muted">
          새 기사가 감지되면 피드에 조용히 쌓입니다.
          <br />
          FA 시장의 작은 신호도 놓치지 않기 위해.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-brand-surface/95 px-6 py-12 text-center shadow-card backdrop-blur-sm">
      <p className="text-sm font-medium text-brand-primary">
        피드를 불러오지 못했습니다
      </p>
      {errorMessage ? (
        <p className="mt-2 text-xs text-brand-muted">{errorMessage}</p>
      ) : null}
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
