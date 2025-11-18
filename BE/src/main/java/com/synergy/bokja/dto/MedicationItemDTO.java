package com.synergy.bokja.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.util.List;

@Getter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.ALWAYS) // TTS audioUrl 필드 포함을 위해
public class MedicationItemDTO {
    private Long mdno;
    private String name;
    private String classification;
    private String image;
    private String description;          // user_medicine_item_table.description
    private String audioUrl;              // TTS 오디오 Base64 인코딩 문자열
    private List<MaterialDTO> materials; // 병용주의 원료 목록
}