import { api } from './api';
import { BaseResponse } from './types';

// 복약 시간 프리셋 DTO
export interface MedicationTimePreset {
  tno: number;
  time: number; // 시간 (0-23)
}

// 복약 시간 프리셋 응답
export interface MedicationTimePresetResponse {
  times: MedicationTimePreset[];
}

// 부작용 프리셋 DTO
export interface SideEffectPreset {
  efno: number;
  name: string;
  image?: string;
}

// 부작용 프리셋 응답
export interface SideEffectPresetResponse {
  effects: SideEffectPreset[];
}

/**
 * 복약 시간 프리셋 조회
 * GET /medication-time-presets?type={type}
 */
export const getMedicationTimePresets = async (
  type: string
): Promise<BaseResponse<MedicationTimePresetResponse>> => {
  try {
    const response = await api.get<BaseResponse<MedicationTimePresetResponse>>(
      `/medication-time-presets?type=${type}`
    );
    return response.data;
  } catch (error: any) {
    console.error('복약 시간 프리셋 조회 실패:', error);
    throw error;
  }
};

/**
 * 부작용 프리셋 조회
 * GET /side-effects-presets
 */
export const getSideEffectPresets = async (): Promise<BaseResponse<SideEffectPresetResponse>> => {
  try {
    const response = await api.get<BaseResponse<SideEffectPresetResponse>>('/side-effects-presets');
    return response.data;
  } catch (error: any) {
    console.error('부작용 프리셋 조회 실패:', error);
    throw error;
  }
};
