package com.synergy.bokja.service;

import com.synergy.bokja.dto.UserLoginRequestDTO;
import com.synergy.bokja.dto.UserSignupRequestDTO;
import com.synergy.bokja.entity.UserEntity;
import com.synergy.bokja.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public Long login(UserLoginRequestDTO request) {
        UserEntity user = userRepository.findByNameAndBirthAndPhone(request.getName(), request.getBirth(), request.getPhone());

        if (user == null) {
            throw new IllegalArgumentException("회원이 존재하지 않습니다.");
        }

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("탈퇴한 회원입니다.");
        }

        return user.getUno();
    }
}
