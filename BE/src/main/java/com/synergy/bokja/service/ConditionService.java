package com.synergy.bokja.service;

import com.synergy.bokja.dto.ConditionCreateRequestDTO;
import com.synergy.bokja.dto.ConditionCreateResponseDTO;
import com.synergy.bokja.dto.ConditionRecordItemDTO;
import com.synergy.bokja.entity.ConditionEntity;
import com.synergy.bokja.entity.EffectEntity;
import com.synergy.bokja.entity.UserEntity;
import com.synergy.bokja.repository.ConditionRepository;
import com.synergy.bokja.repository.EffectRepository;
import com.synergy.bokja.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConditionService {

    private final ConditionRepository conditionRepository;
    private final EffectRepository effectRepository;
    private final UserRepository userRepository;

    public ConditionCreateResponseDTO createCondition(Long uno, ConditionCreateRequestDTO request) {
        Timestamp now = Timestamp.from(Instant.now());

        UserEntity user = userRepository.findByUno(uno);
        if (user == null) {
            throw new IllegalArgumentException("유효하지 않은 uno: " + uno);
        }

        List<ConditionRecordItemDTO> effects = request.getEffects().stream().map(efno -> {
            EffectEntity effect = effectRepository.findByEfno(efno);
            if (effect == null) throw new IllegalArgumentException("유효하지 않은 efno: " + efno);

            ConditionEntity condition = ConditionEntity.builder()
                    .user(user)
                    .effect(effect)
                    .time(now.toLocalDateTime())
                    .build();
            conditionRepository.save(condition);

            return new ConditionRecordItemDTO(effect.getEfno(), effect.getName());
        }).collect(Collectors.toList());

        return new ConditionCreateResponseDTO(effects);
    }
}
