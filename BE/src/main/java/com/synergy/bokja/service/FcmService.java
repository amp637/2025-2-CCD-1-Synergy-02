package com.synergy.bokja.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.synergy.bokja.dto.EventItemResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FcmService {

    private final FirebaseMessaging firebaseMessaging;
    private final ObjectMapper objectMapper; // 3. DTO -> JSON 문자열 변환용

    public void sendEvents(String userFcmToken, EventItemResponseDTO fcmPayload) {

        // FCM 'data' 페이로드 만들기
        try {
            String payloadJson = objectMapper.writeValueAsString(fcmPayload);

            Map<String, String> dataPayload = new HashMap<>();
            dataPayload.put("type", "NEW_EVENTS");
            dataPayload.put("eventData", payloadJson);

            // 5. 기본 알림 설정 (앱이 꺼져있을 때 보임)
            Notification notification = Notification.builder()
                    .setTitle("복약 알림 💊")
                    .setBody("오늘의 복약 일정이 등록되었습니다!")
                    .build();

            // 6. 메시지 빌드
            Message message = Message.builder()
                    .setToken(userFcmToken)
                    .setNotification(notification)
                    .putAllData(dataPayload)
                    .build();

            // 7. 메시지 전송
            String response = firebaseMessaging.send(message);
            System.out.println("FCM 전송 성공: " + response);

        } catch (Exception e) {
            System.err.println("FCM 전송 실패: " + e.getMessage());
        }
    }
}
