import { api } from './api';
import { BaseResponse } from './types';

// 리포트 아이템
export interface ReportItem {
  rno: number;
  hospital: string;
  category: string;
  start_date: string; // YYYY-MM-DD 형식
  end_date: string; // YYYY-MM-DD 형식
}

// 리포트 목록 응답
export interface ReportListResponse {
  report_list: ReportItem[];
}

// 약품 정보
export interface Medicine {
  mdno: number;
  name: string;
  classification: string;
  image?: string;
  information?: string; // 약품 설명 (description 또는 information)
}

// 복약 주기
export interface ReportCycle {
  start_date: string; // YYYY-MM-DD 형식
  end_date: string; // YYYY-MM-DD 형식
  total_cycle: number;
  cur_cycle?: number | null;
  save_cycle?: number | null;
}

// 부작용 아이템
export interface ReportEffectItem {
  efno: number;
  name: string;
  count: number;
}

// 주차별 부작용
export interface ReportEffectWeek {
  week: number;
  effect_list: ReportEffectItem[];
}

// 리포트 상세 응답
export interface ReportDetailResponse {
  rno: number;
  hospital: string;
  category: string;
  taken: number;
  medicine: Medicine[];
  cycle: ReportCycle[];
  effects: ReportEffectWeek[];
  description: string;
}

// 색상 정보
export interface Color {
  date: string; // YYYY-MM-DD 형식
  color: string;
}

// 리포트 요약 응답
export interface ReportSummaryResponse {
  rno: number;
  hospital: string;
  category: string;
  taken: number;
  start_date: string; // YYYY-MM-DD 형식
  end_date: string; // YYYY-MM-DD 형식
  colors: Color[];
}

/**
 * 리포트 목록 조회
 * GET /users/me/reports
 */
export const getUserReports = async (): Promise<BaseResponse<ReportListResponse>> => {
  try {
    console.log('[reportApi] 리포트 목록 조회 시작');
    const response = await api.get<BaseResponse<ReportListResponse>>('/users/me/reports');
    console.log('[reportApi] 리포트 목록 조회 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[reportApi] 리포트 목록 조회 실패:', error);
    console.error('[reportApi] 에러 상세:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * 리포트 상세 조회
 * GET /users/me/reports/{rno}
 */
export const getReportDetail = async (rno: number): Promise<BaseResponse<ReportDetailResponse>> => {
  try {
    const response = await api.get<BaseResponse<ReportDetailResponse>>(`/users/me/reports/${rno}`);
    return response.data;
  } catch (error: any) {
    console.error('리포트 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * 리포트 요약 조회
 * GET /users/me/reports/{rno}/summary
 */
export const getReportSummary = async (rno: number): Promise<BaseResponse<ReportSummaryResponse>> => {
  try {
    const response = await api.get<BaseResponse<ReportSummaryResponse>>(`/users/me/reports/${rno}/summary`);
    return response.data;
  } catch (error: any) {
    console.error('리포트 요약 조회 실패:', error);
    throw error;
  }
};







