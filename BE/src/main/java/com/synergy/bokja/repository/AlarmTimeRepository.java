package com.synergy.bokja.repository;

import com.synergy.bokja.entity.AlarmTimeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlarmTimeRepository extends JpaRepository<AlarmTimeEntity, Long> {
    List<AlarmTimeEntity> findAllByUserMedicine_UmnoIn(List<Long> unmoList);

}
