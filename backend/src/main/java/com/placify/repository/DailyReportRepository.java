package com.placify.repository;

import com.placify.entity.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyReportRepository extends JpaRepository<DailyReport, Long> {

    List<DailyReport> findAllByUserIdOrderByReportDateDesc(Long userId);

    Optional<DailyReport> findByUserIdAndReportDate(Long userId, LocalDate reportDate);

    List<DailyReport> findByUserIdAndReportDateBetweenOrderByReportDateDesc(
            Long userId, LocalDate start, LocalDate end);

    List<DailyReport> findAllByOrderByReportDateDesc();

    List<DailyReport> findByReportDateBetweenOrderByReportDateDesc(LocalDate start, LocalDate end);

    long countByUserId(Long userId);

    @Query("SELECT SUM(dr.hoursStudied) FROM DailyReport dr WHERE dr.userId = :userId AND dr.reportDate BETWEEN :start AND :end")
    Double sumHoursStudiedByUserIdAndDateRange(@Param("userId") Long userId,
                                               @Param("start") LocalDate start,
                                               @Param("end") LocalDate end);

    @Query("SELECT SUM(dr.dsaQuestionsSolved) FROM DailyReport dr WHERE dr.userId = :userId")
    Integer sumDsaQuestionsSolvedByUserId(@Param("userId") Long userId);

    @Query("SELECT dr.reportDate FROM DailyReport dr WHERE dr.userId = :userId ORDER BY dr.reportDate DESC")
    List<LocalDate> findReportDatesByUserId(@Param("userId") Long userId);
}
