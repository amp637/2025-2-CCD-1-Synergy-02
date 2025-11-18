package com.synergy.bokja.controller;

import com.synergy.bokja.auth.JwtTokenProvider;
import com.synergy.bokja.response.BaseResponse;
import com.synergy.bokja.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me/medications")
@RequiredArgsConstructor
public class TtsController {

    private final TtsService ttsService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 복약 정보의 description을 TTS로 변환하여 오디오 파일을 반환합니다.
     * 
     * @param token JWT 토큰
     * @param umno 복약 정보 ID
     * @param enno 이벤트 이름 ID (1: 알림, 3: AI전화) - 기본값: 3
     * @return MP3 오디오 파일
     */
    @GetMapping("/{umno}/tts")
    public ResponseEntity<?> getTts(
            @RequestHeader("Authorization") String token,
            @PathVariable Long umno,
            @RequestParam(defaultValue = "3") Long enno) {

        String jwtToken = token.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(jwtToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token");
        }

        // JWT 토큰 검증을 통과한 사용자 확인 (향후 권한 검증에 사용 가능)
        @SuppressWarnings("unused")
        Long uno = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        try {
            // TTS 생성
            byte[] audioData = ttsService.generateTts(umno, enno);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "tts_audio.mp3");
            headers.setContentLength(audioData.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(audioData);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse<>(4001, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new BaseResponse<>(5001, "TTS 생성 중 오류 발생: " + e.getMessage(), null));
        }
    }
}

