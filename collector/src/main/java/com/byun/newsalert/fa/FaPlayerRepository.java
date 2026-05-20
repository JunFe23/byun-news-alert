package com.byun.newsalert.fa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FaPlayerRepository extends JpaRepository<FaPlayer, Long> {

    @Query("SELECT p FROM FaPlayer p JOIN FETCH p.team ORDER BY p.id")
    List<FaPlayer> findAllWithTeam();
}
