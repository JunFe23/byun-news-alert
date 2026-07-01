# 서비스 종료 체크리스트

2026 KBL FA 시장 종료에 따라 byun-news-alert 운영을 중단합니다.

## 저장소에서 완료된 항목

- [x] GitHub Actions 뉴스 수집 워크플로 삭제 (`.github/workflows/collect-news.yml`)
- [x] web 공개 화면·admin → **서비스 종료** 안내 페이지로 전환

## 직접 확인할 항목 (대시보드·알림 완전 중단)

### 1. cron-job.org

Actions를 10분마다 호출하던 외부 cron이 있으면 **비활성화 또는 삭제**하세요.

- [cron-job.org](https://cron-job.org) → 해당 job → Disable / Delete
- GitHub `workflow_dispatch` URL로 collector를 돌리던 설정이면 반드시 끄기

### 2. Vercel (대시보드 사이트)

이 저장소 `main` 브랜치를 push하면 Vercel이 **종료 안내 페이지**로 자동 배포됩니다.

추가로 완전히 내리려면:

1. [Vercel Dashboard](https://vercel.com) → 프로젝트 선택
2. **Settings → General → Delete Project** (또는 도메인 연결 해제)
3. Environment Variables는 프로젝트 삭제 시 함께 제거됨

### 3. Telegram

collector가 더 이상 실행되지 않으면 **신규 알림은 자동 중단**됩니다.

봇을 완전히 정리하려면 (선택):

- BotFather에서 봇 삭제 또는 토큰 revoke
- GitHub Secrets의 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 삭제

### 4. Supabase (DB)

당장 필요 없으면 **그대로 두어도 됩니다.** 비용·보안 정리 시:

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트
2. **Project Settings → General → Pause project** (일시 중지) 또는 **Delete project**

삭제 전 백업이 필요하면 Table Editor / SQL dump로 export.

### 5. GitHub Secrets (선택)

수집을 재개할 계획이 없으면 Repository → Settings → Secrets and variables → Actions에서 아래 삭제:

- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `SUPABASE_DB_*`
- `TELEGRAM_*`

## 코드 보관

collector·web 소스는 저장소에 남아 있습니다. FA 시장이 다시 필요하면 워크플로와 화면을 복구할 수 있습니다.
