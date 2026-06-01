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
| `contract_status` | 계약 상태 (FA, 잔류, 이적, 계약미체결, 은퇴 등). DB에 `미정`이 남아 있으면 화면에서는 `은퇴`로 표시 |
| `new_team_id` | 이적·재계약 예정 팀 (`fa_teams.id` FK) |
| `contract_note` | 메모·부가 설명 |
| `contract_amount` | 계약금액(원, BIGINT) — 현황판에 표시 |
| `contract_years` | 계약기간(년, INTEGER) — 현황판에 `N년` 형태로 표시 |
| `contract_date` | 계약일자(DATE, `YYYY-MM-DD`) — 현황판·admin에서 표시·정렬 |
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

### Vercel Web Analytics

1. Vercel 프로젝트 → **Analytics** 탭에서 **Web Analytics**를 활성화합니다.
2. 이 앱은 `@vercel/analytics`의 `<Analytics />`를 `app/layout.tsx`에 포함합니다. 별도 환경변수는 필요 없습니다.
3. Vercel에 배포된 Production(및 Preview) URL에서 페이지뷰가 수집됩니다. 로컬 `npm run dev`에서는 기본적으로 전송되지 않을 수 있습니다.
4. GA4(`NEXT_PUBLIC_GA_MEASUREMENT_ID`)와 함께 사용해도 됩니다.

### Vercel Speed Insights

1. Vercel 프로젝트 → **Speed Insights** 탭에서 기능을 활성화합니다.
2. 이 앱은 `@vercel/speed-insights`의 `<SpeedInsights />`를 `app/layout.tsx`에 포함합니다 (`<Analytics />`와 함께). 별도 환경변수는 필요 없습니다.
3. Vercel에 배포된 Production(및 Preview) URL의 Core Web Vitals 등 성능 데이터가 수집됩니다. 로컬 `npm run dev`에서는 기본적으로 전송되지 않을 수 있습니다.

## UI / 브랜드

- **2026 KBL FA 레이더** — KBL 전체 FA 시장을 보는 스포츠 뉴스룸 톤
- 버건디(`#7A2438`) 포인트 + 중립 크림·그레이 배경 (특정 구단 팬페이지 느낌 제거)
- 헤더 마크: 농구공 SVG + `FA` / `KBL` 텍스트 배지 (구단 마스코트 이미지 없음)
- 헤더 카피: `KBL FREE AGENCY WATCH` · `2026 KBL FA 레이더`

## 화면 동작

- 상단 탭: **뉴스 피드** / **FA 현황판**
- **뉴스 피드**: 기본적으로 `news_items` 최신 100건만 표시 (`detected_at` DESC, `pub_date` 보조)
- **팀·선수 필터**: 전체 최신 100건을 클라이언트에서 거르지 않습니다. `news_player_mentions` → `fa_players` 관계로 조건에 맞는 `news_item_id`를 Supabase에서 먼저 찾은 뒤, 그 중 최신 100건을 조회합니다. 오래된 기사라도 해당 선수/팀과 연결되면 필터 결과에 포함됩니다.
- **상단 건수**: `news_items` 전체 count(별도 head 조회) + 현재 화면에 로딩된 건수 — 예: `전체 128건 수집 · 최근 100건 표시`. count 조회 실패 시 `최근 n건 표시`만 표시합니다.
- 로딩 / 빈 목록 / 오류 상태 처리
- 기사 대표 이미지: `/api/link-preview` Open Graph 추출

## 기사 대표 이미지 (Open Graph)

기사 이미지는 DB에 저장하지 않습니다. `GET /api/link-preview?url=...` 로 `og:image` 등을 가져옵니다.

- fetch 타임아웃 5초, 실패 시 텍스트 카드만 표시
- `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
- 썸네일은 **블러 배경 + 전면 contain** 구조로 원본 비율을 유지하며 잘리지 않게 표시 (모바일 max-height 약 360px, 데스크톱 약 420px)

## FA 현황판

- 팀별 선수 목록, 계약 상태·새 팀·계약기간·계약금액·**계약일자**·메모·관련 뉴스 수
- 선수 목록 정렬(필터 적용 후에도 동일):
  1. `contract_date` DESC NULLS LAST
  2. `status_updated_at` DESC NULLS LAST
  3. `player_name` ASC (가나다)
- 계약일자 표시: 있으면 `2026.05.22` 형식, 없으면 `-`
- 팀 섹션 순서: 각 팀 내 최신 계약일자 선수 기준으로 최신 팀이 위쪽
- **관련 뉴스 보기** → 뉴스 피드 + 해당 선수 필터
- FA 전광판 「최근 계약」: `contract_date` DESC (`status_updated_at`·이름은 동순위 보조). `contract_date` 없거나 `contract_status`가 FA/빈값이면 제외

계약 정보(`contract_status`, `new_team_id`, `contract_years`, `contract_amount`, `contract_date`, `contract_note`)와 `status_updated_at`은 **관리자 페이지(`/admin`)에서 수동 업데이트**합니다. 뉴스 수집(collector)과는 별도입니다.

## 관리자 페이지 (`/admin`)

계약 체결 현황(계약 상태·계약팀·계약년수·계약금액·메모)을 모바일에서도 수정할 수 있는 관리 화면입니다. 공개 홈에는 링크를 두지 않으며, 주소를 직접 입력해 접속합니다.

관리자가 수정하는 `fa_players` 컬럼: `contract_status`, `new_team_id`, `contract_years`, `contract_amount`, `contract_date`(`input type="date"`, 빈 값 → `null`), `contract_note`, `status_updated_at`(저장 시 자동 갱신).

1. 로컬: `web/.env.local`에 `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`를 추가합니다.
2. Vercel: 위 두 변수를 **Production** (필요 시 Preview) 환경에 설정한 뒤 재배포합니다.
3. 브라우저에서 `https://<your-domain>/admin` 접속 → 비밀번호 입력 → 선수 카드에서 수정 후 **저장**.

- 수정 요청은 `PATCH /api/admin/fa-players/[id]` 로만 처리되며, service role key는 서버 API Route에서만 사용합니다.
- 비밀번호 검증은 서버의 `ADMIN_PASSWORD`와 비교합니다 (클라이언트 번들에 비밀번호 환경변수를 넣지 않음).

## 운영 기록: 런치 2일차 분석 (2026-05-21 ~ 05-22, KST)

공개 배포 직후 이틀간의 **GA4 유입**과 **Supabase 수집·현황 반영**을 정리한 메모입니다. 이후 같은 형식으로 날짜별 섹션을 이어서 적어도 됩니다.

### 배경

- KBL FA 일정상 해당 구간은 **구단-선수 자율협상** 기간(공시 5/18 ~ 자율협상 종료 6/1)입니다.
- collector `APP_NEWS_FROM_DATE` 기본값: `2026-05-18` (이 날짜 이후 기사만 저장).

### 트래픽 (GA4)

| 구간 | 활성 사용자 | 해석 |
|------|-------------|------|
| 5/16 ~ 5/20 | 0 | 서비스 미노출·미측정 구간 |
| **5/21** | **피크 152** | 사실상 **런치 데이** (신규 사용자 152 ≈ 거의 전원 첫 방문) |
| **5/22** | **약 50~60** | 전일 대비 **60% 이상 감소**, 0은 아님 |

- **이벤트** 약 1.5k → 방문자당 약 **10회** 수준 (탭·필터·카드 클릭 등).
- **주요 이벤트 0** → GA4에 전환 목표(예: 필터 클릭, 관련 뉴스 보기)를 아직 설정하지 않은 상태. 행동 깊이는 이벤트 수·실시간 보고서로만 추정.
- 스포츠 앱 유사군 중앙값(약 100) 대비 **5/21 하루만 크게 상회**, **5/22는 중앙값 근처·약간 하회** → 첫날 붐 → 둘째날 일상 트래픽 패턴.

**5/21 유입이 컸던 이유(추정):** 변준형·표승빈 등 **대형 잔류** 기사가 몰리면서 공유·텔레그램·직접 URL 유입이 겹친 날.

**5/22 유입이 줄어든 이유(추정):** 시장 이슈가 **이윤기 이적 1건** 수준으로 줄고, 최대어 결말 뉴스 사이클이 하루 지나 관심 피크가 지난 영향.

### 수집·반영 (Supabase, KST 일자 기준)

#### 뉴스 저장 (`news_items.detected_at`)

| 날짜 | 신규 저장 | Telegram 알림 (`is_alert_sent`, watch·변준형 매칭) | 톤 |
|------|-----------|-----------------------------------------------------|-----|
| **5/21** | **15건** | **8건** | 변준형·표승빈·정관장 잔류 집중 |
| **5/22** | **5건** | **2건** | 이윤기 이적 + FA 칼럼·후속 기사 |

5/21 대표 흐름: 변준형 3년+보수 **잔류**, 표승빈 **2년 1억** 재계약, 정관장 내부 FA 연쇄 보도.

5/22 대표 흐름: **DB, FA 이윤기 3년·보수 1.3억 영입**이 핵심, 나머지는 「주요 FA」 시리즈·정관장 후속 수준.

#### 현황판 계약 반영 (`fa_players.status_updated_at`, 잔류·이적만)

| 날짜 | 의미 있는 반영 | 내용 |
|------|----------------|------|
| **5/21** | **3명** | 변준형·표승빈·정인덕 **잔류** (금액·기간 반영) |
| **5/22** | **1명** | **이윤기 이적** (3년·1.3억 수준) |

※ 5/21에 `status_updated_at`이 대량으로 찍힌 FA 행은 **명단 전체 FA 초기 세팅·일괄 반영**으로 보는 것이 맞습니다. **실제 시장 이벤트**는 위 **3+1건**이 핵심입니다.

#### 5/22 시점 스냅샷 (`contract_status` 집계)

- **FA 44 · 잔류 3 · 이적 1** — 아직 대부분 미결(FA). 5/21 정관장 3명 잔류 후, 5/22 리그 전체로는 **이윤기 1건** 추가.

### 이틀 비교 (한눈에)

| | **5/21** | **5/22** |
|--|----------|----------|
| **시장** | FA 최대어급 **잔류 폭발** | **이적 1건** 중심, 나머지 칼럼·후속 |
| **수집** | 뉴스·알림 모두 활발 | 약 **1/3** 수준 |
| **방문** | 152 (신규 유입 폭발) | 50~60 (첫날 붐 이후 잔류) |

### 서비스 관점 메모

1. **5/21 = 콘텐츠·트래픽 동시 피크** — 변준형 런치와 맞물린 유입으로 해석하는 것이 타당함.
2. **5/22 = 시장·트래픽 동시 냉각** — 전광판 「최근 반영」도 이윤기 위주로 보이기 쉬운 날.
3. 자율협상 중반~후반에는 **조용한 날**이 더 나올 수 있음. **6/2 영입의향서** 구간부터 다시 밀도가 올라갈 수 있음.
4. GA **주요 이벤트**를 정의하면(필터 변경, FA 현황판 진입, 관련 뉴스 보기 등) 이후 일차 비교가 쉬워짐.

### 숫자 다시 확인하는 방법

```bash
cd web
# .env.local에 NEXT_PUBLIC_SUPABASE_* 필요
set -a && source .env.local && set +a
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  for (const [day, next] of [['2026-05-21','2026-05-22'],['2026-05-22','2026-05-23']]) {
    const since = day + 'T00:00:00+09:00', until = next + 'T00:00:00+09:00';
    const { count: news } = await sb.from('news_items').select('id', { count: 'exact', head: true }).gte('detected_at', since).lt('detected_at', until);
    const { count: alerts } = await sb.from('news_items').select('id', { count: 'exact', head: true }).gte('detected_at', since).lt('detected_at', until).eq('is_alert_sent', true);
    const { data: deals } = await sb.from('fa_players').select('player_name,contract_status').gte('status_updated_at', since).lt('status_updated_at', until).in('contract_status', ['잔류','이적','계약미체결','은퇴']);
    console.log(day, { news, alerts, deals: deals?.map(p => p.player_name + ' ' + p.contract_status) });
  }
})();
"
```

GA4는 **보고서 → 실시간 / 사용자 획득**에서 동일 기간을 선택해 비교합니다.
