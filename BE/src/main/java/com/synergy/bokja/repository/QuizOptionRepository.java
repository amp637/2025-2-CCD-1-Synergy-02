package com.synergy.bokja.repository;

import com.synergy.bokja.entity.QuizOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizOptionRepository extends JpaRepository<QuizOptionEntity, Long> {
    List<QuizOptionEntity> findAllByQuiz_Qno(Long qno);
    List<QuizOptionEntity> findAllByQuiz_QnoIn(List<Long> qnoList);
}
