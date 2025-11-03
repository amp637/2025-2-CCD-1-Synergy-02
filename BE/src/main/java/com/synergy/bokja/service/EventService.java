package com.synergy.bokja.service;

import com.synergy.bokja.dto.*;
import com.synergy.bokja.entity.*;
import com.synergy.bokja.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final DescriptionRepository descriptionRepository;
    private final EventRepository eventRepository;
    private final UserMedicineRepository userMedicineRepository;
    private final EventNameRepository eventNameRepository;
    private final AlarmTimeRepository alarmTimeRepository;
    private final QuizRepository quizRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final CycleRepository cycleRepository;

    public AIScriptResponseDTO getAIScript(Long umno) {
        DescriptionEntity description = descriptionRepository.findByUserMedicine_UmnoAndEventName_Enno(umno, 3l); // AI call -> enno : 3

        return new AIScriptResponseDTO(
                description.getUserMedicine().getUmno(),
                description.getDescription()
        );
    }

    public EventItemResponseDTO getEventList(Long uno) {

        List<UserMedicineEntity> userMedicines = userMedicineRepository.findAllByUser_Uno(uno);

        List<Long> umnoList = userMedicines.stream()
                .map(UserMedicineEntity::getUmno)
                .collect(Collectors.toList());

        List<EventEntity> events = eventRepository.findAllByUserMedicine_UmnoIn(umnoList);

        Map<Long, UserMedicineEntity> umMap = userMedicines.stream()
                .collect(Collectors.toMap(UserMedicineEntity::getUmno, entity -> entity));

        Map<Long, AlarmTimeEntity> atMap = alarmTimeRepository.findAllByUserMedicine_UmnoIn(umnoList).stream()
                .collect(Collectors.toMap(AlarmTimeEntity::getAtno, entity -> entity));

        Map<Long, EventNameEntity> enMap = eventNameRepository.findAll().stream()
                .collect(Collectors.toMap(EventNameEntity::getEnno, entity -> entity));

        Map<Long, DescriptionEntity> dMap = descriptionRepository.findAllByEventName_Enno(1L).stream()
                .collect(Collectors.toMap(description -> description.getUserMedicine().getUmno(), entity -> entity));

        Map<Long, QuizEntity> qMap = quizRepository.findAllByUserMedicine_UmnoIn(umnoList).stream()
                .collect(Collectors.toMap(quiz -> quiz.getUserMedicine().getUmno(), entity -> entity));

        List<EventItemDTO> dtoList = events.stream().map(event -> {

            UserMedicineEntity um = umMap.get(event.getUserMedicine().getUmno());
            AlarmTimeEntity at = atMap.get(event.getAlarmTime().getAtno());
            EventNameEntity en = enMap.get(event.getEventName().getEnno());
            DescriptionEntity d = dMap.get(event.getUserMedicine().getUmno());
            QuizEntity q = qMap.get(event.getUserMedicine().getUmno());

            Long eno = event.getEno();
            Long umno = um.getUmno();
            String name = (en != null) ? en.getName() : "알 수 없는 이벤트";
            LocalDateTime time = (at != null) ? event.getCreatedAt().toLocalDate().atTime(at.getTime().getTime()) : event.getCreatedAt();
            String hospital = (um != null) ? um.getHospital() : "알 수 없는 병원";
            String category = (um != null) ? um.getCategory() : "미분류";
            String description = (d != null) ? d.getDescription() : "설명 없음";

            CandidateDTO candidate = null;
            if (q != null) {
                List<QuizOptionEntity> options = quizOptionRepository.findAllByQuiz_Qno(q.getQno());
                String answer = options.stream().filter(QuizOptionEntity::getIsCorrect).findFirst().map(QuizOptionEntity::getContent).orElse("정답 없음");
                List<String> wrongs = options.stream().filter(o -> !o.getIsCorrect()).map(QuizOptionEntity::getContent).collect(Collectors.toList());
                candidate = new CandidateDTO(answer, wrongs);
            }

            return new EventItemDTO(eno, umno, name, time, hospital, category, description,
                    (q != null) ? q.getQuestion() : "퀴즈 없음",
                    candidate);

        }).collect(Collectors.toList());

        return new EventItemResponseDTO(uno, dtoList);
    }

    @Transactional
    public updateEventStatusResponseDTO updateEventStatus(Long eno) {

        EventEntity event = eventRepository.findById(eno)
                .orElseThrow(() -> new IllegalArgumentException("해당 이벤트를 찾을 수 없습니다. eno: " + eno));

        event.setStatus(EventStatus.완료);
        event.setUpdatedAt(LocalDateTime.now());

        try {
            Long umnoToFind = event.getUserMedicine().getUmno();

            CycleEntity cycle = cycleRepository.findByUserMedicine_Umno(umnoToFind)
                    .orElseThrow(() -> new NullPointerException("Cycle not found for umno: " + umnoToFind));

            int currentSaveCycle = (cycle.getSaveCycle() != null) ? cycle.getSaveCycle() : 0;
            cycle.setSaveCycle(currentSaveCycle + 1);

        } catch (NullPointerException e) {
            System.out.println("Cycle 정보를 찾는 데 실패했습니다. " + e.getMessage());
        }

        return new updateEventStatusResponseDTO(event.getEno());
    }
}
