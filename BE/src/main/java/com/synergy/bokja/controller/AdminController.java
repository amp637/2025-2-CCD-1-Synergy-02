package com.synergy.bokja.controller;

import com.synergy.bokja.batch.EventBatchScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminController {

    private final EventBatchScheduler eventBatchScheduler;

    @PostMapping("/admin/run-batch")
    public ResponseEntity<String> forceRunBatch() {
        eventBatchScheduler.runDailyEventGeneration();
        return ResponseEntity.ok("배치 수동 실행 성공 !");
    }
}
