-- 2026 KBL FA 수집용 팀/선수 seed
-- Supabase SQL Editor에서 실행하세요.
--
-- match_keywords: 팀·구단을 식별하는 브랜드/구단명만 사용합니다.
-- 지역명(안양, 서울, 수원 등)만 단독으로 넣지 마세요. (동명이인·타 지역 오탐 방지)

INSERT INTO fa_teams (team_name, short_name, match_keywords)
SELECT team_name, short_name, match_keywords
FROM (VALUES
  ('안양 정관장', '정관장', ARRAY['정관장', '레드부스터스', '레드부']),
  ('부산 KCC', 'KCC', ARRAY['KCC', '부산 KCC']),
  ('창원 LG', 'LG', ARRAY['LG', '창원 LG', 'LG 사이온스']),
  ('대구 한국가스공사', '가스공사', ARRAY['가스공사', 'KOGAS', '페가수스', '한국가스공사']),
  ('고양 소노', '소노', ARRAY['소노', 'SONO', '케이지', '소노 스카이거너스']),
  ('서울 SK', 'SK', ARRAY['SK', '서울 SK', 'SK 나이츠']),
  ('수원 KT', 'KT', ARRAY['KT', '수원 KT', 'KT 소닉붐']),
  ('울산 현대모비스', '현대모비스', ARRAY['현대모비스', '모비스', '울산 현대모비스']),
  ('원주 DB', 'DB', ARRAY['DB', '원주 DB', 'DB 프로미']),
  ('서울 삼성', '삼성', ARRAY['삼성', '삼성 썬더스', '썬더스'])
) AS v(team_name, short_name, match_keywords)
WHERE NOT EXISTS (
  SELECT 1 FROM fa_teams t WHERE t.short_name = v.short_name
);

-- 선수 목록은 2026 FA 대상에 맞게 Supabase에서 관리·갱신하세요. (아래는 예시)
INSERT INTO fa_players (team_id, player_name, status)
SELECT t.id, v.player_name, 'fa'
FROM (VALUES
  ('정관장', '변준형'),
  ('정관장', '전성현'),
  ('KCC', '허웅'),
  ('LG', '김선형'),
  ('가스공사', '김종규'),
  ('소노', '이승현'),
  ('SK', '최준용'),
  ('KT', '양희승'),
  ('현대모비스', '라건아'),
  ('DB', '김나준'),
  ('삼성', '이정현')
) AS v(short_name, player_name)
JOIN fa_teams t ON t.short_name = v.short_name
WHERE NOT EXISTS (
  SELECT 1 FROM fa_players p
  WHERE p.team_id = t.id AND p.player_name = v.player_name
);
