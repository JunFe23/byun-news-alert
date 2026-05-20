package com.byun.newsalert.collector;

import com.byun.newsalert.config.AppProperties;
import com.byun.newsalert.fa.FaPlayer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class TelegramAlertPolicy {

    private final Set<String> alertPlayerNames;

    public TelegramAlertPolicy(AppProperties appProperties) {
        this.alertPlayerNames = parseAlertPlayerNames(appProperties.getTelegram().getAlertPlayerNames());
        log.info("Telegram 알림 대상 선수: {}", alertPlayerNames);
    }

    /**
     * watch 모드이고, 매칭된 선수 중 알림 대상 선수가 있을 때만 true.
     */
    public boolean shouldSendTelegramAlert(String mode, List<FaPlayer> matchedPlayers) {
        if (!"watch".equalsIgnoreCase(mode)) {
            return false;
        }
        if (matchedPlayers == null || matchedPlayers.isEmpty()) {
            return false;
        }
        return matchedPlayers.stream()
                .map(FaPlayer::getPlayerName)
                .anyMatch(alertPlayerNames::contains);
    }

    private Set<String> parseAlertPlayerNames(List<String> configured) {
        if (configured == null || configured.isEmpty()) {
            return Set.of("변준형");
        }

        Set<String> names = new HashSet<>();
        for (String entry : configured) {
            if (entry == null || entry.isBlank()) {
                continue;
            }
            if (entry.contains(",")) {
                Arrays.stream(entry.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .forEach(names::add);
            } else {
                names.add(entry.trim());
            }
        }

        if (names.isEmpty()) {
            return Set.of("변준형");
        }
        return Set.copyOf(names);
    }
}
