import { api } from './api';
import { BaseResponse } from './types';

// 이벤트 후보 답안
export interface Candidate {
  answer: string;
  wrong: string[];
}

// 이벤트 아이템
export interface EventItem {
  eno: number;
  umno: number;
  name: string;
  time: string; // ISO 8601 형식
  hospital: string;
  category: string;
  description: string;
  question: string;
  candidate: Candidate;
  audioUrl?: string; // TTS 오디오 URL (camelCase)
  audio_url?: string; // TTS 오디오 URL (snake_case, 하위 호환성)
}

// 이벤트 목록 응답
export interface EventItemResponse {
  uno: number;
  events: EventItem[];
}

// AI 스크립트 응답
export interface AIScriptResponse {
  umno: number;
  description: string;
  audio_url: string; // Base64 인코딩된 오디오
}

// 이벤트 상태 업데이트 응답
export interface UpdateEventStatusResponse {
  eno: number;
}

/**
 * 이벤트 목록 조회
 * GET /users/me/events
 */
export const getEvents = async (): Promise<BaseResponse<EventItemResponse>> => {
  try {
    const response = await api.get<BaseResponse<EventItemResponse>>('/users/me/events');
    return response.data;
  } catch (error: any) {
    console.error('[getEvents] 이벤트 목록 조회 실패:', error.message);
    throw error;
  }
};

/**
 * AI 전화 스크립트 조회
 * GET /users/me/events/{umno}
 */
export const getAIScript = async (umno: number): Promise<BaseResponse<AIScriptResponse>> => {
  try {
    const response = await api.get<BaseResponse<AIScriptResponse>>(`/users/me/events/${umno}`);
    return response.data;
  } catch (error: any) {
    console.error('[getAIScript] AI 스크립트 조회 실패:', error.message);
    throw error;
  }
};

/**
 * 이벤트 상태 업데이트 (복약 완료 처리)
 * POST /users/me/events/{eno}
 */
export const updateEventStatus = async (eno: number): Promise<BaseResponse<UpdateEventStatusResponse>> => {
  try {
    const response = await api.post<BaseResponse<UpdateEventStatusResponse>>(`/users/me/events/${eno}`);
    return response.data;
  } catch (error: any) {
    console.error('[updateEventStatus] 이벤트 상태 업데이트 실패:', error.message);
    throw error;
  }
};



