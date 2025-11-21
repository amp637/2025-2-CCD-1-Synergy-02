package com.synergy.bokja.batch;

import com.synergy.bokja.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class EventBatchScheduler {

    private final EventService eventService;

    /**
     * 매일 00시 00분 00초에 실행
     * (cron = "초 분 시 일 월 요일")
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void runDailyEventGeneration() {
        System.out.println(LocalDateTime.now() + " :: 일간 이벤트 생성 배치 작업을 시작합니다...");

        // 3. 실제 로직은 서비스 클래스에 위임
        eventService.createAndSendDailyEvents();

        System.out.println(LocalDateTime.now() + " :: 일간 이벤트 생성 배치 작업을 완료했습니다.");
    }
}