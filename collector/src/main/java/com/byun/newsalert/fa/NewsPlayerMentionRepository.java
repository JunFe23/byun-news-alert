package com.byun.newsalert.fa;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsPlayerMentionRepository extends JpaRepository<NewsPlayerMention, Long> {

    boolean existsByNewsItemIdAndPlayerId(Long newsItemId, Long playerId);
}
