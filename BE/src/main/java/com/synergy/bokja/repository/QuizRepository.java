package com.synergy.bokja.repository;

import com.synergy.bokja.entity.QuizEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<QuizEntity, Long> {
    List<QuizEntity> findAllByUserMedicine_UmnoIn(List<Long> umnoList);
}