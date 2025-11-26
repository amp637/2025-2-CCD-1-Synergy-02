package com.synergy.bokja.repository;

import com.synergy.bokja.entity.DescriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DescriptionRepository extends JpaRepository<DescriptionEntity, Long> {

    DescriptionEntity findByUserMedicine_UmnoAndEventName_Enno(Long umno, Long Enno);

    DescriptionEntity findTop1ByUserMedicine_UmnoAndEventName_Enno(Long umno, Long enno);

    List<DescriptionEntity> findAllByUserMedicine_UmnoInAndEventName_Enno(List<Long> umnoList, Long enno);
}
