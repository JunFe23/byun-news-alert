# byun-news-alert web

Supabase `news_items` 테이블에 저장된 변준형 FA 관련 뉴스를 인스타그램 피드 형태로 보여주는 공개 Next.js 화면입니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JS (anon key만 사용)

## 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

**주의:** service role key, DB password, Telegram token, Naver secret은 이 앱에 넣지 마세요.

로컬에서는 `web/.env.local` 파일로 설정합니다 (git에 커밋하지 않음).

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase RLS

anon key로 `news_items`를 읽으려면 **SELECT** 정책이 필요합니다. 예시:

```sql
create policy "Allow public read on news_items"
  on public.news_items
  for select
  to anon
  using (true);
```

Supabase Dashboard → **Authentication** → **Policies** 또는 SQL Editor에서 설정하세요.

FA 확장 기능(팀/선수/멘션)을 사용하려면 아래 테이블에도 **SELECT** 정책이 필요합니다.

- `fa_teams`
- `fa_players`
- `news_player_mentions`

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
4. Deploy 후 발급된 URL을 친구들과 공유합니다.

Framework Preset은 Next.js가 자동 감지됩니다. Build Command: `npm run build`, Output: Next.js 기본값.

## 기사 대표 이미지 (Open Graph)

기사 이미지는 **DB에 저장하지 않습니다.** 각 카드의 `link` URL에 대해 Next.js 서버 API(`/api/link-preview`)가 해당 페이지 HTML을 읽고 `og:image`(없으면 `twitter:image`) 등 Open Graph 메타 정보를 추출해 표시합니다. 텔레그램 링크 미리보기와 같은 방식입니다.

- API: `GET /api/link-preview?url=...`
- fetch 타임아웃 5초, 실패 시 이미지 없이 텍스트 카드만 표시
- 응답은 CDN/브라우저 캐시 (`Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`)

## UI / 브랜드

- **fan-made newsroom** 무드: 웜 아이보리·버건디 틴트 배경, 은은한 radial gradient·노이즈 텍스처
- 정관장·레드부스터스 계열 딥 레드(`#7A1E2C`) 포인트, 크림 톤 키워드 pill
- 마스코트 **레드부**는 `public/redboo.png` — 헤더·빈 상태에만 작게(약 48px)
- 기사 이미지는 DB가 아닌 Open Graph 미리보기 API로 표시
- 헤더: `Anyang Red Boosters Watch` · `오늘의 FA 레이더` 감성 카피

## 화면 동작

- `detected_at` 기준 최신 50건 조회
- 최대 너비 640px 중앙 정렬 카드 피드
- 제목·기사 보기 클릭 시 새 탭에서 기사 링크 열기
- 날짜는 한국 시간(KST) 형식
- 로딩 / 빈 목록 / 오류 상태 처리
- 상단 sticky 헤더, 새로고침, 마지막 업데이트 시각 표시
- 카드 상단에 OG 이미지 미리보기 (16:9, `object-cover`)

## 뉴스 피드 필터

- 상단 탭에서 **뉴스 피드 / FA 현황판** 전환
- 뉴스 피드에서 **팀별 / 선수별** 필터 제공 (모바일 가로 스크롤 pill)
- 필터링은 `news_player_mentions` 관계를 기반으로 동작합니다.
- 기본값은 전체, 선택 시 해당 팀/선수와 연결된 뉴스만 표시됩니다.

## FA 현황판

- 팀별로 선수 목록을 보여주고, **상태/팀 필터**를 제공합니다.
- 선수 카드에 **원소속팀, 계약상태, 새 팀, 메모, 관련 뉴스 수**를 표시합니다.
- 선수 카드의 **관련 뉴스 보기**를 누르면 뉴스 피드로 이동하며 해당 선수 필터가 적용됩니다.

### 계약상태 관리

`fa_players.contract_status`, `new_team_id`, `contract_note`, `status_updated_at` 등은\n+**DB에서 수동 관리**하는 값입니다. (관리 UI는 별도 구현 예정)
