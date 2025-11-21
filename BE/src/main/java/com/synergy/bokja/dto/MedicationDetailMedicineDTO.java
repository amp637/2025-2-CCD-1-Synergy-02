package com.synergy.bokja.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS) // TTS audioUrl 필드 포함을 위해
public class MedicationDetailMedicineDTO {
    private Long mdno;
    private String name;
    private String classification;
    private String image;
    private String information;
    private String description;
    private String audioUrl; // TTS 오디오 Base64 인코딩 문자열
    private List<MaterialDTO> materials;
}
