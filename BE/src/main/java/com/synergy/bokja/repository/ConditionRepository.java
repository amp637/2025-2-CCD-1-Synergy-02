package com.synergy.bokja.repository;

import com.synergy.bokja.entity.ConditionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

public interface ConditionRepository extends JpaRepository<ConditionEntity, Long> {

    List<ConditionEntity> findAllByUser_UnoAndTimeBetween(Long uno, LocalDateTime start, LocalDateTime end);
}
