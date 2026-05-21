# byun-news-alert web

2026 KBL FA 시장 뉴스를 팀별·선수별로 모아보는 공개 Next.js 화면입니다. Supabase에 저장된 `news_items`·`fa_players`·`news_player_mentions` 데이터를 읽습니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JS (공개 화면: anon key / 관리자 수정: API Route + service role key)

## 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (예: `G-XXXXXXXXXX`, 선택) |
| `ADMIN_PASSWORD` | `/admin` 관리자 비밀번호 (서버 전용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (서버 전용, **NEXT_PUBLIC_ 금지**) |

**주의:** `SUPABASE_SERVICE_ROLE_KEY`는 클라이언트에 노출되면 안 됩니다. DB password, Telegram token, Naver secret도 이 앱에 넣지 마세요.

로컬에서는 `web/.env.local` 파일로 설정합니다 (git에 커밋하지 않음).

예시는 [`web/.env.example`](.env.example)를 참고하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
ADMIN_PASSWORD=change-me
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Supabase RLS

anon key로 읽으려면 아래 테이블에 **SELECT** 정책이 필요합니다.

- `news_items`
- `fa_teams`
- `fa_players`
- `news_player_mentions`

예시:

```sql
create policy "Allow public read on news_items"
  on public.news_items
  for select
  to anon
  using (true);
```

## 필요한 DB 컬럼

FA 현황판·필터가 정상 동작하려면 아래 컬럼이 Supabase에 있어야 합니다.

### `fa_players`

| 컬럼 | 용도 |
|------|------|
| `contract_status` | 계약 상태 (FA, 잔류, 이적 등) |
| `new_team_id` | 이적·재계약 예정 팀 (`fa_teams.id` FK) |
| `contract_note` | 메모·부가 설명 |
| `contract_amount` | 계약금액(원, BIGINT) — 현황판에 표시 |
| `contract_years` | 계약기간(년, INTEGER) — 현황판에 `N년` 형태로 표시 |
| `status_updated_at` | 상태 마지막 수정 시각 |

### `fa_teams`

| 컬럼 | 용도 |
|------|------|
| `logo_path` | 팀 로고 경로 (예: `/team-logos/db.svg`, `public/team-logos/`에 파일 배치) |

컬럼이 없거나 RLS가 막혀 있으면 화면에는 개발자 메시지 대신 **「데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.」** 가 표시됩니다. 상세 오류는 브라우저 콘솔에만 기록됩니다.

## 로컬 실행

```bash
cd web
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

프로덕션 빌드 확인:

```bash
npm run build
npm start
```

## Vercel 배포

1. [Vercel](https://vercel.com)에서 이 저장소를 Import 합니다.
2. **Root Directory**를 `web`으로 설정합니다.
3. **Environment Variables**에 아래를 추가합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` (GA4 유입 분석, 선택)
   - `ADMIN_PASSWORD` (관리자 페이지 비밀번호)
   - `SUPABASE_SERVICE_ROLE_KEY` (관리자 API 전용 — **절대 `NEXT_PUBLIC_` 접두사 사용 금지**)
4. Deploy 후 발급된 URL을 공유합니다.

### GA4 (Vercel)

1. [Google Analytics](https://analytics.google.com)에서 웹 데이터 스트림을 만들고 **Measurement ID** (`G-…`)를 복사합니다.
2. Vercel 프로젝트 → **Settings** → **Environment Variables**에 추가합니다.
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (실제 ID)
   - Environment: Production (Preview도 필요하면 동일하게 추가)
3. 재배포 후 **GA4 → 보고서 → 실시간**에서 본인 접속이 보이는지 확인합니다.
4. 값이 비어 있으면 앱은 정상 동작하고 GA 스크립트만 로드하지 않습니다.

## UI / 브랜드

- **2026 KBL FA 레이더** — KBL 전체 FA 시장을 보는 스포츠 뉴스룸 톤
- 버건디(`#7A2438`) 포인트 + 중립 크림·그레이 배경 (특정 구단 팬페이지 느낌 제거)
- 헤더 마크: 농구공 SVG + `FA` / `KBL` 텍스트 배지 (구단 마스코트 이미지 없음)
- 헤더 카피: `KBL FREE AGENCY WATCH` · `2026 KBL FA 레이더`

## 화면 동작

- 상단 탭: **뉴스 피드** / **FA 현황판**
- `detected_at` 기준 최신 100건 조회
- 팀·선수 필터 (`news_player_mentions` 기반)
- 로딩 / 빈 목록 / 오류 상태 처리
- 기사 대표 이미지: `/api/link-preview` Open Graph 추출

## 기사 대표 이미지 (Open Graph)

기사 이미지는 DB에 저장하지 않습니다. `GET /api/link-preview?url=...` 로 `og:image` 등을 가져옵니다.

- fetch 타임아웃 5초, 실패 시 텍스트 카드만 표시
- `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
- 썸네일은 `object-fit: contain`으로 원본 비율을 유지하며 잘리지 않게 표시 (최대 높이 제한)

## FA 현황판

- 팀별 선수 목록, 계약 상태·새 팀·계약기간·계약금액·메모·관련 뉴스 수
- **관련 뉴스 보기** → 뉴스 피드 + 해당 선수 필터

계약 정보(`contract_status`, `new_team_id`, `contract_years`, `contract_amount`, `contract_note`)와 `status_updated_at`은 **관리자 페이지(`/admin`)에서 수동 업데이트**합니다. 뉴스 수집(collector)과는 별도입니다.

## 관리자 페이지 (`/admin`)

계약 체결 현황(계약 상태·계약팀·계약금액·메모)을 모바일에서도 수정할 수 있는 관리 화면입니다. 공개 홈에는 링크를 두지 않으며, 주소를 직접 입력해 접속합니다.

1. 로컬: `web/.env.local`에 `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`를 추가합니다.
2. Vercel: 위 두 변수를 **Production** (필요 시 Preview) 환경에 설정한 뒤 재배포합니다.
3. 브라우저에서 `https://<your-domain>/admin` 접속 → 비밀번호 입력 → 선수 카드에서 수정 후 **저장**.

- 수정 요청은 `PATCH /api/admin/fa-players/[id]` 로만 처리되며, service role key는 서버 API Route에서만 사용합니다.
- 비밀번호 검증은 서버의 `ADMIN_PASSWORD`와 비교합니다 (클라이언트 번들에 비밀번호 환경변수를 넣지 않음).
