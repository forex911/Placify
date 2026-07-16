package com.placify.repository;

import com.placify.entity.Hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HackathonRepository extends JpaRepository<Hackathon, Long> {
    List<Hackathon> findByUserIdOrderByDateDesc(Long userId);
    List<Hackathon> findAllByOrderByDateDesc();
    long countByUserId(Long userId);
}
