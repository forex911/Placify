package com.placify.repository;

import com.placify.entity.LeetCodeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeetCodeProfileRepository extends JpaRepository<LeetCodeProfile, Long> {

    Optional<LeetCodeProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
