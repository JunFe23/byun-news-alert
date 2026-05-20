package com.byun.newsalert.collector;

import com.byun.newsalert.fa.FaPlayer;
import com.byun.newsalert.fa.FaTeam;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class PlayerRelevanceService {

    /** 강한 농구 문맥 — 이 중 하나는 반드시 있어야 저장 가능 */
    public static final List<String> STRONG_BASKETBALL_CONTEXT_KEYWORDS = List.of(
            "자유계약선수 명단",
            "KBL 자유계약",
            "프로농구 FA",
            "KBL FA",
            "농구 FA",
            "프로농구",
            "남자농구",
            "자유계약선수",
            "보수 총액",
            "샐러리캡",
            "KBL",
            "농구"
    );

    /** 기업명/지역명과 혼동 적은 명확한 농구팀 식별 키워드 */
    public static final List<String> SPECIFIC_BASKETBALL_TEAM_KEYWORDS = List.of(
            "정관장",
            "레드부스터스",
            "프로미",
            "세이커스",
            "썬더스",
            "스카이거너스",
            "나이츠",
            "이지스",
            "소닉붐",
            "페가수스",
            "현대모비스",
            "모비스",
            "피버스",
            "한국가스공사",
            "가스공사"
    );

    /** 약한 키워드 — 강한 농구 문맥이 있을 때만 matched_keywords 수집용 */
    private static final List<String> WEAK_AUXILIARY_KEYWORDS = List.of(
            "LG", "SK", "DB", "KT", "삼성", "KCC", "소노",
            "계약", "FA", "구단", "영입", "이적", "잔류"
    );

    private static final List<String> NON_PLAYER_ROLE_WORDS = List.of(
            "기자", "특파원", "인턴기자", "객원기자",
            "본부장", "부사장", "사장", "대표", "전무", "상무", "이사", "임원",
            "연구원", "연구소", "팀장"
    );

    private static final List<String> BASEBALL_EXCLUDE_KEYWORDS = List.of(
            "야구", "KBO", "투수", "우완", "좌완", "타자", "타율", "홈런", "타선",
            "두산", "한화", "롯데", "SSG", "키움",
            "NC 다이노스", "NC",
            "삼성 라이온즈", "LG 트윈스", "KT 위즈",
            "KIA", "기아 타이거즈",
            "베어스", "이글스", "자이언츠", "와이번스", "히어로즈"
    );

    private static final List<String> FINANCE_CORPORATE_EXCLUDE_KEYWORDS = List.of(
            "ETF", "코스닥", "코스피", "주식", "증권", "투자", "자산운용",
            "선물", "현물", "펀드", "금융", "상장", "수익률", "거래소", "운용사",
            "현대차", "기아", "삼성전자", "LG전자", "네이버",
            "연구소", "본부장", "사장", "대표", "임원", "플랫폼", "협의체"
    );

    public MatchResult matchPlayers(String title, String description, List<FaPlayer> players) {
        String rawTitle = title == null ? "" : title;
        String rawDesc = description == null ? "" : description;
        String rawText = rawTitle + " " + rawDesc;
        String cleanedText = removeByline(rawText);

        boolean strongBasketball = hasStrongBasketballContext(cleanedText);
        boolean specificTeam = hasSpecificBasketballTeamContext(cleanedText);
        boolean baseballExcluded = hasKeywordHit(cleanedText, BASEBALL_EXCLUDE_KEYWORDS);
        boolean financeExcluded = hasKeywordHit(cleanedText, FINANCE_CORPORATE_EXCLUDE_KEYWORDS);

        if (baseballExcluded && !strongBasketball) {
            return MatchResult.skip(cleanedText, SkipReason.BASEBALL_CONTEXT);
        }
        if (financeExcluded && !strongBasketball) {
            return MatchResult.skip(cleanedText, SkipReason.FINANCE_CORPORATE_CONTEXT);
        }
        if (!strongBasketball && !specificTeam) {
            return MatchResult.skip(cleanedText, SkipReason.NO_BASKETBALL_CONTEXT);
        }

        List<FaPlayer> matched = new ArrayList<>();
        boolean anyNonPlayerRoleHit = false;

        for (FaPlayer player : players) {
            FaTeam team = player.getTeam();
            if (team == null) continue;

            String playerName = player.getPlayerName();
            if (playerName == null || playerName.isBlank()) continue;

            if (!rawTitle.contains(playerName) && !rawDesc.contains(playerName)) {
                continue;
            }

            if (isNonPlayerRoleMention(rawTitle, playerName) || isNonPlayerRoleMention(rawDesc, playerName)) {
                anyNonPlayerRoleHit = true;
                continue;
            }

            if (!isRelevantToPlayer(cleanedText, playerName, strongBasketball, specificTeam)) {
                continue;
            }

            matched.add(player);
        }

        if (matched.isEmpty()) {
            if (anyNonPlayerRoleHit) {
                return MatchResult.skip(cleanedText, SkipReason.NON_PLAYER_ROLE_PATTERN);
            }
            return MatchResult.skip(cleanedText, SkipReason.NO_PLAYER_MATCH);
        }

        return MatchResult.matched(matched, cleanedText);
    }

    private boolean isRelevantToPlayer(
            String cleanedText,
            String playerName,
            boolean strongBasketball,
            boolean specificTeam
    ) {
        if (!cleanedText.contains(playerName)) {
            return false;
        }
        return strongBasketball || specificTeam;
    }

    public List<String> collectMatchedKeywords(String text, List<FaPlayer> matchedPlayers) {
        Set<String> keywords = new LinkedHashSet<>();
        boolean strongBasketball = hasStrongBasketballContext(text);

        for (FaPlayer player : matchedPlayers) {
            keywords.add(player.getPlayerName());
        }

        addMatchedFromList(text, STRONG_BASKETBALL_CONTEXT_KEYWORDS, keywords);
        addMatchedFromList(text, SPECIFIC_BASKETBALL_TEAM_KEYWORDS, keywords);

        if (strongBasketball) {
            addMatchedFromList(text, WEAK_AUXILIARY_KEYWORDS, keywords);
            for (FaPlayer player : matchedPlayers) {
                FaTeam team = player.getTeam();
                if (team != null) {
                    keywords.add(team.getShortName());
                    addMatchedSpecificTeamOnly(text, team.getMatchKeywords(), keywords);
                }
            }
        }

        return List.copyOf(keywords);
    }

    /** fa_teams.match_keywords 중 명확한 팀 키워드만 추가 (LG/KT/삼성 등 약어 제외) */
    private void addMatchedSpecificTeamOnly(String text, String[] teamKeywords, Set<String> target) {
        if (teamKeywords == null) return;
        for (String keyword : teamKeywords) {
            if (keyword == null || keyword.isBlank()) continue;
            if (isWeakAuxiliaryKeyword(keyword)) continue;
            if (text.contains(keyword)) {
                target.add(keyword);
            }
        }
    }

    private boolean isWeakAuxiliaryKeyword(String keyword) {
        for (String weak : WEAK_AUXILIARY_KEYWORDS) {
            if (weak.equalsIgnoreCase(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasStrongBasketballContext(String text) {
        return hasKeywordHit(text, STRONG_BASKETBALL_CONTEXT_KEYWORDS);
    }

    private boolean hasSpecificBasketballTeamContext(String text) {
        return hasKeywordHit(text, SPECIFIC_BASKETBALL_TEAM_KEYWORDS);
    }

    private boolean hasKeywordHit(String text, List<String> keywords) {
        for (String keyword : keywords) {
            if (matchesKeyword(text, keyword)) {
                return true;
            }
        }
        return false;
    }

    private void addMatchedFromList(String text, List<String> keywords, Set<String> target) {
        for (String keyword : keywords) {
            if (matchesKeyword(text, keyword)) {
                target.add(keyword);
            }
        }
    }

    private boolean matchesKeyword(String text, String keyword) {
        if (keyword.chars().allMatch(c -> c < 128)) {
            return text.toUpperCase(Locale.ROOT).contains(keyword.toUpperCase(Locale.ROOT));
        }
        return text.contains(keyword);
    }

    private boolean isNonPlayerRoleMention(String text, String playerName) {
        if (text == null || text.isBlank()) return false;
        String escaped = Pattern.quote(playerName);
        String roles = String.join("|", NON_PLAYER_ROLE_WORDS);
        Pattern p = Pattern.compile(
                escaped + "\\s*(" + roles + ")(가|는|의|으로|와|과)?",
                Pattern.UNICODE_CASE
        );
        return p.matcher(text).find();
    }

    private String removeByline(String text) {
        if (text == null || text.isBlank()) return "";

        String out = text;
        String roles = "기자|특파원|인턴기자|객원기자";

        out = out.replaceAll("\\|[^|]{0,120}=\\s*[가-힣]{2,6}\\s*(" + roles + ")\\s*\\|", " ");
        out = out.replaceAll("\\[[^\\]]{0,80}\\]\\s*[가-힣]{2,6}\\s*(" + roles + ")\\s*=?\\s*", " ");
        out = out.replaceAll("(^|\\s)[가-힣]{2,6}\\s*(" + roles + ")\\s*=?\\s*", " ");
        out = out.replaceAll("[가-힣]{2,6}\\s*(" + roles + ")(가|는|의)\\s*", " ");

        return out.replaceAll("\\s{2,}", " ").trim();
    }

    public enum SkipReason {
        NONE,
        BASEBALL_CONTEXT,
        FINANCE_CORPORATE_CONTEXT,
        NON_PLAYER_ROLE_PATTERN,
        NO_BASKETBALL_CONTEXT,
        NO_PLAYER_MATCH
    }

    public record MatchResult(
            List<FaPlayer> matchedPlayers,
            String cleanedText,
            SkipReason skipReason
    ) {
        static MatchResult matched(List<FaPlayer> players, String cleanedText) {
            return new MatchResult(players, cleanedText, SkipReason.NONE);
        }

        static MatchResult skip(String cleanedText, SkipReason reason) {
            return new MatchResult(List.of(), cleanedText, reason);
        }

        boolean hasMatches() {
            return skipReason == SkipReason.NONE && !matchedPlayers.isEmpty();
        }
    }
}
