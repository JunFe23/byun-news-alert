package com.byun.newsalert.collector;

import com.byun.newsalert.fa.FaPlayer;
import com.byun.newsalert.fa.FaTeam;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class PlayerRelevanceService {

    public static final List<String> COMMON_KBL_FA_KEYWORDS = List.of(
            "KBL",
            "프로농구",
            "남자농구",
            "FA",
            "자유계약",
            "자유계약선수",
            "계약",
            "이적",
            "잔류",
            "영입",
            "협상",
            "미체결"
    );

    public boolean isRelevantToPlayer(String text, FaPlayer player, FaTeam team) {
        if (text == null || text.isBlank() || player == null || team == null) {
            return false;
        }

        String playerName = player.getPlayerName();
        if (playerName == null || playerName.isBlank() || !text.contains(playerName)) {
            return false;
        }

        return hasTeamKeyword(text, team) || hasCommonKeyword(text);
    }

    public List<FaPlayer> findMatchingPlayers(String text, List<FaPlayer> players) {
        List<FaPlayer> matched = new ArrayList<>();
        for (FaPlayer player : players) {
            FaTeam team = player.getTeam();
            if (team != null && isRelevantToPlayer(text, player, team)) {
                matched.add(player);
            }
        }
        return matched;
    }

    public List<String> collectMatchedKeywords(String text, List<FaPlayer> matchedPlayers) {
        Set<String> keywords = new LinkedHashSet<>();

        for (FaPlayer player : matchedPlayers) {
            keywords.add(player.getPlayerName());
            FaTeam team = player.getTeam();
            if (team != null) {
                keywords.add(team.getShortName());
                addMatchedFromArray(text, team.getMatchKeywords(), keywords);
            }
        }

        addMatchedFromList(text, COMMON_KBL_FA_KEYWORDS, keywords);
        return List.copyOf(keywords);
    }

    private boolean hasTeamKeyword(String text, FaTeam team) {
        String[] matchKeywords = team.getMatchKeywords();
        if (matchKeywords == null) {
            return false;
        }
        for (String keyword : matchKeywords) {
            if (keyword != null && !keyword.isBlank() && text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasCommonKeyword(String text) {
        for (String keyword : COMMON_KBL_FA_KEYWORDS) {
            if (matchesKeyword(text, keyword)) {
                return true;
            }
        }
        return false;
    }

    private void addMatchedFromArray(String text, String[] keywords, Set<String> target) {
        if (keywords == null) {
            return;
        }
        for (String keyword : keywords) {
            if (keyword != null && !keyword.isBlank() && text.contains(keyword)) {
                target.add(keyword);
            }
        }
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
}
