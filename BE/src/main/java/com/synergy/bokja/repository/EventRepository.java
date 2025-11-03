package com.synergy.bokja.repository;

import com.synergy.bokja.entity.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<EventEntity, Long> {
    List<EventEntity> findAllByUserMedicine_UmnoIn(List<Long> umnoList);
}
