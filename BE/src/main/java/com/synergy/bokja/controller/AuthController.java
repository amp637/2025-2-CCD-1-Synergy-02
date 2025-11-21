package com.synergy.bokja.controller;

import com.synergy.bokja.auth.JwtTokenProvider;
import com.synergy.bokja.response.BaseResponse;
import com.synergy.bokja.dto.UserLoginRequestDTO;
import com.synergy.bokja.dto.UsersResponseDTO;
import com.synergy.bokja.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> signup(@RequestBody UserLoginRequestDTO request) {

        Long uno = authService.login(request);
        String token = jwtTokenProvider.createToken(uno);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", token);

        UsersResponseDTO responseBody = new UsersResponseDTO(uno);

        BaseResponse<UsersResponseDTO> response =
                new BaseResponse<>(1000, "로그인 성공", responseBody);

        return ResponseEntity.ok()
                .headers(headers)
                .body(response);
    }
}
