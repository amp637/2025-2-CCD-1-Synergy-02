import { api } from './api';
import { BaseResponse } from './types';

// 부작용 생성 요청
export interface ConditionCreateRequest {
  effects: number[]; // efno 리스트
}

// 부작용 생성 응답
export interface ConditionCreateResponse {
  cno: number;
}

/**
 * 부작용 생성
 * POST /users/me/side-effects
 */
export const createCondition = async (
  effects: number[]
): Promise<BaseResponse<ConditionCreateResponse>> => {
  try {
    console.log(`[createCondition] API 호출 시작 - effects:`, effects);
    console.log(`[createCondition] 요청 URL: /users/me/side-effects`);
    console.log(`[createCondition] 요청 body:`, JSON.stringify({ effects }, null, 2));
    
    const response = await api.post<BaseResponse<ConditionCreateResponse>>(
      '/users/me/side-effects',
      { effects }
    );
    
    console.log(`[createCondition] 응답 상태: ${response.status}`);
    console.log(`[createCondition] 응답 데이터:`, JSON.stringify(response.data, null, 2));
    console.log(`[createCondition] 성공 - resultCode: ${response.data?.header?.resultCode}`);
    
    return response.data;
  } catch (error: any) {
    console.error('=== 부작용 생성 실패 ===');
    console.error('에러 타입:', error.constructor.name);
    console.error('에러 메시지:', error.message);
    console.error('effects:', effects);
    
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
    
    throw error;
  }
};







