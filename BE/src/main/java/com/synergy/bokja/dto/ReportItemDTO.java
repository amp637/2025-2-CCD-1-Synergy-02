package com.synergy.bokja.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReportItemDTO {
    private Long rno;
    private String hospital;
    private String category;
    private String start_date;
    private String end_date;
}