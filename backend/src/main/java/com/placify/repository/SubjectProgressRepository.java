package com.placify.repository;

import com.placify.entity.SubjectProgress;
import com.placify.entity.SubjectProgress.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectProgressRepository extends JpaRepository<SubjectProgress, Long> {

    List<SubjectProgress> findAllByUserId(Long userId);

    Optional<SubjectProgress> findByUserIdAndSubject(Long userId, Subject subject);

    boolean existsByUserIdAndSubject(Long userId, Subject subject);

    @Query("SELECT AVG(sp.progressPercentage) FROM SubjectProgress sp WHERE sp.userId = :userId")
    Double findAverageProgressByUserId(@Param("userId") Long userId);

    @Query("SELECT sp FROM SubjectProgress sp ORDER BY sp.userId, sp.subject")
    List<SubjectProgress> findAllOrderByUserIdAndSubject();
}
