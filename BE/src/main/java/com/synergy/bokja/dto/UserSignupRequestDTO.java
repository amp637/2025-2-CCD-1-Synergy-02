package com.synergy.bokja.dto;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSignupRequestDTO {
    private String name;
    private LocalDate birth;
    private String phone;
    private String fcmToken;
}