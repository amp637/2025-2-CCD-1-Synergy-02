package com.synergy.bokja.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.ALWAYS) // null이 아닌 모든 필드 포함
public class AIScriptResponseDTO {
    @JsonProperty("umno")
    Long umno;
    
    @JsonProperty("description")
    String description;
    
    @JsonProperty("audio_url")
    String audioUrl; // TTS 오디오 Base64 인코딩 문자열
}
