package com.synergy.bokja.dto;

import lombok.Getter;

@Getter
public class UsersResponseDTO {

    private Long uno;

    public UsersResponseDTO(Long uno) {
        this.uno = uno;
    }

}