import { api } from './api';
import { BaseResponse } from './types';

// 복약 시간 설정 요청
export interface UserMedicationTimeRequest {
  tno: number;
}

// 복약 시간 설정 응답
export interface UserMedicationTimeResponse {
  utno: number;
  uno: number;
  tno: number;
}

// 복약 시간 조회 응답
export interface GetUserMedicationTimeResponse {
  uno: number;
  utno: number;
  tno: number;
  type: string;
  time: number;
}

// 복약 시간 수정 요청
export interface UpdateUserMedicationTimeRequest {
  type: string;
  time: number;
}

// 사용자 정보 수정 요청
export interface UpdateUserInfoRequest {
  uno: number;
  name: string;
  birth: string; // YYYY-MM-DD 형식
  phone: string;
}

// 사용자 정보 응답
export interface UserInfoResponse {
  uno: number;
  name: string;
  birth: string;
  phone: string;
}

// 오늘의 복약 정보
export interface UserTodayMedication {
  umno: number;
  hospital: string;
  category: string;
  taken: number;
  startAt: string; // YYYY-MM-DD 형식
}

// 오늘의 복약 목록 응답
export interface UserTodayMedicationResponse {
  medications: UserTodayMedication[];
}

/**
 * 복약 시간 설정 (온보딩)
 * POST /users/me/medication-times
 */
export const setMedicationTime = async (
  tno: number
): Promise<BaseResponse<UserMedicationTimeResponse>> => {
  try {
    const response = await api.post<BaseResponse<UserMedicationTimeResponse>>(
      '/users/me/medication-times',
      { tno }
    );
    return response.data;
  } catch (error: any) {
    console.error('복약 시간 설정 실패:', error);
    throw error;
  }
};

/**
 * 복약 시간 조회
 * GET /users/me/medication-times?type={type}
 */
export const getMedicationTime = async (
  type: string
): Promise<BaseResponse<GetUserMedicationTimeResponse>> => {
  try {
    const response = await api.get<BaseResponse<GetUserMedicationTimeResponse>>(
      `/users/me/medication-times?type=${type}`
    );
    return response.data;
  } catch (error: any) {
    console.error('복약 시간 조회 실패:', error);
    throw error;
  }
};

/**
 * 복약 시간 수정
 * PATCH /users/me/medication-times/{utno}
 */
export const updateMedicationTime = async (
  utno: number,
  request: UpdateUserMedicationTimeRequest
): Promise<BaseResponse<GetUserMedicationTimeResponse>> => {
  try {
    const response = await api.patch<BaseResponse<GetUserMedicationTimeResponse>>(
      `/users/me/medication-times/${utno}`,
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('복약 시간 수정 실패:', error);
    throw error;
  }
};

/**
 * 사용자 정보 수정
 * PATCH /users/me
 */
export const updateUserInfo = async (
  request: UpdateUserInfoRequest
): Promise<BaseResponse<UserInfoResponse>> => {
  try {
    const response = await api.patch<BaseResponse<UserInfoResponse>>(
      '/users/me',
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('사용자 정보 수정 실패:', error);
    throw error;
  }
};

/**
 * 사용자 정보 조회
 * GET /users/me
 */
export const getUserInfo = async (): Promise<BaseResponse<UserInfoResponse>> => {
  try {
    const response = await api.get<BaseResponse<UserInfoResponse>>('/users/me');
    return response.data;
  } catch (error: any) {
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

/**
 * 오늘의 복약 목록 조회
 * GET /users/me/medications
 */
export const getUserMedications = async (): Promise<BaseResponse<UserTodayMedicationResponse>> => {
  try {
    console.log('=== getUserMedications 호출 시작 ===');
    console.log('요청 URL: /users/me/medications');
    
    const response = await api.get<BaseResponse<UserTodayMedicationResponse>>('/users/me/medications');
    
    console.log('응답 상태:', response.status);
    console.log('응답 헤더:', JSON.stringify(response.headers, null, 2));
    console.log('응답 데이터:', JSON.stringify(response.data, null, 2));
    console.log('=== getUserMedications 성공 ===');
    
    return response.data;
  } catch (error: any) {
    console.error('=== getUserMedications 실패 ===');
    console.error('에러 타입:', error.constructor.name);
    console.error('에러 메시지:', error.message);
    
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
      console.error('응답 헤더:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('요청은 보냈지만 응답을 받지 못함');
      console.error('요청 URL:', error.config?.url);
      console.error('요청 헤더:', JSON.stringify(error.config?.headers, null, 2));
    } else {
      console.error('요청 설정 중 에러:', error.message);
    }
    
    console.error('오늘의 복약 목록 조회 실패:', error);
    throw error;
  }
};

