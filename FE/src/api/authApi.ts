import { api, API_BASE_URL } from './api';
import { BaseResponse } from './types';

// 회원가입 요청 타입 (백엔드 UserSignupRequestDTO와 일치)
export interface SignUpRequest {
  name: string;
  phone: string;
  birth: string; // 백엔드는 "birth" 필드명 사용, LocalDate 타입 (YYYY-MM-DD 형식)
  fcm_token?: string; // 백엔드 스펙에 맞게 fcm_token으로 변경
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
    console.log('=== 회원가입 API 호출 시작 ===');
    console.log('회원가입 데이터:', signUpData);
    console.log('API Base URL:', API_BASE_URL);
    
    // 🔥 필드 순서를 보장하기 위해 수동으로 JSON 문자열 생성
    const orderedJsonString = `{
  "name": "${signUpData.name}",
  "birth": "${signUpData.birth}",
  "phone": "${signUpData.phone}",
  "fcm_token": "${signUpData.fcm_token}"
}`;
    
    console.log('순서가 보장된 JSON:', orderedJsonString);
    
    // 백엔드 엔드포인트: POST /users
    const response = await api.post<BaseResponse<UsersResponseDTO>>('/users', JSON.parse(orderedJsonString));
    
    console.log('회원가입 응답 상태:', response.status);
    console.log('회원가입 응답 헤더:', response.headers);
    console.log('회원가입 응답 데이터:', response.data);
    
    // 응답 헤더에서 토큰 확인 (axios는 헤더를 소문자로 변환)
    const authHeader = response.headers['authorization'] || response.headers.authorization;
    if (authHeader) {
      console.log('회원가입 응답에서 토큰 발견:', authHeader.substring(0, 20) + '...');
    } else {
      console.warn('회원가입 응답에 토큰이 없습니다.');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('=== 회원가입 실패 ===');
    console.error('에러 타입:', error.constructor.name);
    console.error('에러 메시지:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      console.error('요청은 보냈지만 응답을 받지 못함:', error.request);
      console.error('요청 URL:', error.config?.url);
      console.error('요청 Base URL:', error.config?.baseURL);
    } else {
      console.error('요청 설정 중 에러:', error.message);
    }
    console.error('전체 에러 객체:', error);
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
    console.log('=== 로그인 API 호출 시작 ===');
    console.log('[login] 요청 URL: /auth/login');
    console.log('[login] 요청 메서드: POST');
    console.log('[login] API Base URL:', API_BASE_URL);
    console.log('[login] 요청 데이터:', JSON.stringify(loginData, null, 2));
    
    // 데이터 검증
    if (!loginData.name || !loginData.phone || !loginData.birth) {
      console.error('[login] ❌ 필수 필드 누락:', {
        name: !!loginData.name,
        phone: !!loginData.phone,
        birth: !!loginData.birth
      });
      throw new Error('로그인 데이터가 불완전합니다.');
    }
    
    // 전화번호 형식 확인 (하이픈 제거되어야 함)
    if (loginData.phone.includes('-')) {
      console.warn('[login] ⚠️ 전화번호에 하이픈이 포함되어 있습니다:', loginData.phone);
    }
    
    // 생년월일 형식 확인
    if (!/^\d{4}-\d{2}-\d{2}$/.test(loginData.birth)) {
      console.error('[login] ❌ 생년월일 형식이 올바르지 않습니다:', loginData.birth);
      throw new Error('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD 형식이어야 합니다)');
    }
    
    // 백엔드 엔드포인트: POST /auth/login
    const response = await api.post<BaseResponse<UsersResponseDTO>>('/auth/login', loginData);
    
    console.log('[login] ✅ 응답 상태:', response.status);
    console.log('[login] 응답 헤더:', JSON.stringify(response.headers, null, 2));
    console.log('[login] 응답 데이터:', JSON.stringify(response.data, null, 2));
    
    // 응답 헤더에서 토큰 확인 (axios는 헤더를 소문자로 변환)
    const authHeader = response.headers['authorization'] || response.headers.authorization;
    if (authHeader) {
      console.log('[login] ✅ 로그인 응답에서 토큰 발견:', authHeader.substring(0, 30) + '...');
    } else {
      console.warn('[login] ⚠️ 로그인 응답에 토큰이 없습니다.');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('=== 로그인 실패 ===');
    console.error('[login] 에러 타입:', error.constructor.name);
    console.error('[login] 에러 메시지:', error.message);
    
    if (error.response) {
      console.error('[login] ❌ 응답 상태:', error.response.status);
      console.error('[login] 응답 데이터:', JSON.stringify(error.response.data, null, 2));
      console.error('[login] 응답 헤더:', JSON.stringify(error.response.headers, null, 2));
      
      // 500 에러인 경우 상세 정보 출력
      if (error.response.status === 500) {
        console.error('[login] ⚠️ 500 Internal Server Error 발생!');
        console.error('[login] 백엔드 로그를 확인해야 합니다.');
        console.error('[login] 전송된 요청 데이터:', JSON.stringify(loginData, null, 2));
      }
    } else if (error.request) {
      console.error('[login] 요청은 보냈지만 응답을 받지 못함');
      console.error('[login] 요청 URL:', error.config?.url);
      console.error('[login] 요청 메서드:', error.config?.method);
      console.error('[login] 요청 헤더:', JSON.stringify(error.config?.headers, null, 2));
      console.error('[login] 요청 데이터:', JSON.stringify(error.config?.data, null, 2));
      
      // 요청 헤더에 Authorization이 있는지 확인 (있으면 안 됨)
      const authHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization;
      if (authHeader) {
        console.error('[login] ❌ 로그인 요청에 Authorization 헤더가 포함되어 있습니다! (제거되어야 함)');
      } else {
        console.log('[login] ✅ 로그인 요청에 Authorization 헤더가 없습니다. (정상)');
      }
    } else {
      console.error('[login] 요청 설정 중 에러:', error.message);
    }
    
    console.error('[login] 전체 에러 객체:', error);
    throw error;
  }
};

