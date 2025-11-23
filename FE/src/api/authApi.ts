import { api } from './api';
import { BaseResponse } from './types';

// 회원가입 요청 타입 (백엔드 UserSignupRequestDTO와 일치)
export interface SignUpRequest {
  name: string;
  phone: string;
  birth: string; // 백엔드는 "birth" 필드명 사용, LocalDate 타입 (YYYY-MM-DD 형식)
  fcmToken: string;
}

// 회원가입 응답 데이터 타입
export interface UsersResponseDTO {
  uno: number; // 사용자 번호
}

// 로그인 요청 타입
export interface LoginRequest {
  name: string;
  phone: string;
  birth: string; // YYYY-MM-DD 형식
}

/**
 * 회원가입 API 호출
 * @param signUpData 회원가입 정보 (이름, 전화번호, 생년월일, FCM 토큰)
 * @returns 회원가입 응답 (백엔드 BaseResponse 형식)
 */
export const signUp = async (signUpData: SignUpRequest): Promise<BaseResponse<UsersResponseDTO>> => {
  try {
    // 백엔드 엔드포인트: POST /users
    const response = await api.post<BaseResponse<UsersResponseDTO>>('/users', signUpData);
    return response.data;
  } catch (error: any) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};

/**
 * 로그인 API 호출
 * @param loginData 로그인 정보 (이름, 전화번호, 생년월일)
 * @returns 로그인 응답 (백엔드 BaseResponse 형식)
 */
export const login = async (loginData: LoginRequest): Promise<BaseResponse<UsersResponseDTO>> => {
  try {
    // 백엔드 엔드포인트: POST /auth/login
    const response = await api.post<BaseResponse<UsersResponseDTO>>('/auth/login', loginData);
    return response.data;
  } catch (error: any) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

