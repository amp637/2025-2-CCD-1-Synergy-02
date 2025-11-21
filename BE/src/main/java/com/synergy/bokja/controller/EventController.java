package com.synergy.bokja.controller;

import com.synergy.bokja.auth.JwtTokenProvider;
import com.synergy.bokja.dto.AIScriptResponseDTO;
import com.synergy.bokja.dto.EventItemResponseDTO;
import com.synergy.bokja.dto.updateEventStatusResponseDTO;
import com.synergy.bokja.response.BaseResponse;
import com.synergy.bokja.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/{umno}")
    public ResponseEntity<?> getScript(@RequestHeader("Authorization") String token,
                                             @PathVariable Long umno) {
        String jwtToken = token.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(jwtToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token");
        }

        @SuppressWarnings("unused")
        Long uno = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        AIScriptResponseDTO result = eventService.getAIScript(umno);
        
        BaseResponse<AIScriptResponseDTO> response =
                new BaseResponse<>(1000, "AI 전화 스크립트 조회 성공", result);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("")
    public ResponseEntity<?> getEvents(@RequestHeader("Authorization") String token) {
        String jwtToken = token.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(jwtToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token");
        }

        @SuppressWarnings("unused")
        Long uno = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        EventItemResponseDTO result = eventService.getEventList(uno);
        BaseResponse<EventItemResponseDTO> response =
                new BaseResponse<>(1000, "이벤트 조회 성공", result);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{eno}")
    public ResponseEntity<?> updateEvent(@RequestHeader("Authorization") String token,
                                       @PathVariable Long eno) {
        String jwtToken = token.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(jwtToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token");
        }

        Long uno = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        updateEventStatusResponseDTO result = eventService.updateEventStatus(eno);
        BaseResponse<updateEventStatusResponseDTO> response =
                new BaseResponse<>(1000, "이벤트 상태 업데이트 성공", result);
        return ResponseEntity.ok(response);
    }

}
