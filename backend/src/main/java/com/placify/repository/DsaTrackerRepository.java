package com.placify.repository;

import com.placify.entity.DsaTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DsaTrackerRepository extends JpaRepository<DsaTracker, Long> {

    List<DsaTracker> findAllByUserId(Long userId);

    Optional<DsaTracker> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    boolean existsByUserIdAndTopicName(Long userId, String topicName);

    @Query("SELECT AVG(d.progressPercentage) FROM DsaTracker d")
    Double findAverageProgress();

    @Query("SELECT AVG(d.progressPercentage) FROM DsaTracker d WHERE d.userId = :userId")
    Double findAverageProgressByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(d.solvedQuestions) FROM DsaTracker d WHERE d.userId = :userId")
    Long sumSolvedQuestionsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM DsaTracker d WHERE d.userId = :userId AND d.progressPercentage = 100")
    long countCompletedTopicsByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(d.solvedQuestions) FROM DsaTracker d")
    Long sumAllSolvedQuestions();
}
