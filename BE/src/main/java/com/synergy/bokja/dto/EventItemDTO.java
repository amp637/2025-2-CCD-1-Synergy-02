package com.synergy.bokja.dto;

import com.synergy.bokja.entity.QuizOptionEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class EventItemDTO {

    private Long eno;
    private Long umno;
    private String name;
    private LocalDateTime time;
    private String hospital;
    private String category;
    private String description;
    private String question;
    private CandidateDTO candidate;
}
