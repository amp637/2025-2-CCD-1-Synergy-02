package com.synergy.bokja.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class ReportSummaryResponseDTO {
    private Long rno;
    private String hospital;
    private String category;
    private int taken;
    private String start_date;
    private String end_date;
    private List<ColorDTO> colors;
}