import { api, API_BASE_URL } from './api';
import { BaseResponse } from './types';
import { useAuthStore } from '../stores/authStore';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

// ==============================
// 타입 정의 (그대로 유지)
// ==============================
export interface MedicationCreateResponse {
  umno: number;
}
export interface MedicationDetailMedicine {
  mdno: number;
  name: string;
  classification: string;
  image?: string;
  description?: string;
  information?: string;
  audioUrl?: string;
  warning?: {
    title: string;
    items: string[];
  };
  materials?: Array<{ mtno: number; name: string }>;
}
export interface MedicationDetailResponse {
  umno: number;
  hospital: string;
  category: string;
  taken: number;
  comb: string;
  medicines: MedicationDetailMedicine[];
}
export interface MedicationCategoryUpdateResponse {
  umno: number;
  category: string;
}
export interface MedicationSummaryResponse {
  hospital: string;
  category: string;
  medicines: MedicationDetailMedicine[];
}
export interface MedicationCombinationResponse {
  umno: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  night: number;
}
export interface MedicationTimeItem {
  uno: number;
  atno: number;
  umno: number;
  type: string;
  time: number;
}
export interface MedicationTimeUpdateResponse {
  atno: number;
  type: string;
  time: number;
}
export interface UserTodayMedication {
  umno: number;
  hospital: string;
  category: string;
  taken: number;
  startAt: string;
}
export interface UserTodayMedicationResponse {
  medications: UserTodayMedication[];
}

// ==============================
// 업로드 중복 방지
// ==============================
let isUploading = false;

// ==============================
// 처방전/약봉투 업로드
// ==============================
export const uploadMedication = async (
  mode: '1' | '2',
  imageUri: string
): Promise<BaseResponse<MedicationCreateResponse>> => {
  if (isUploading) {
    throw new Error('이미 업로드 중입니다. 잠시 후 다시 시도해주세요.');
  }

  isUploading = true;

  try {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    console.log('=== 📤 이미지 업로드 시작 ===');
    console.log('Mode:', mode, `(${mode === '1' ? '처방전' : '약봉투'})`);
    console.log('원본 Image URI:', imageUri);

    // ==============================
    // 이미지 리사이징 및 JPEG 변환
    // ==============================
    console.log('=== 🖼️ 이미지 리사이징 및 JPEG 변환 시작 ===');
    let processedImageUri = imageUri;
    
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }], // 가로 1024px로 리사이징 (비율 유지)
        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG } // JPEG, 품질 100% (그대로 유지)
      );
      
      processedImageUri = manipResult.uri;
      console.log('✅ 이미지 리사이징 완료');
      console.log('처리된 Image URI:', processedImageUri);
    } catch (manipError) {
      console.error('❌ 이미지 리사이징 실패:', manipError);
      console.log('원본 이미지로 업로드 진행');
      // 리사이징 실패 시 원본 이미지 사용
    }

    // ==============================
    // 파일 정보 상세 확인
    // ==============================
    const fileInfo = await FileSystem.getInfoAsync(processedImageUri);
    
    console.log('=== 📁 FileSystem 파일 정보 ===');
    console.log('파일 존재 여부:', fileInfo.exists);
    console.log('파일 URI:', processedImageUri);
    console.log('Local URL:', processedImageUri);
    
    if (fileInfo.exists && 'size' in fileInfo) {
      console.log('파일 크기:', fileInfo.size, 'bytes');
      console.log('파일 크기 (KB):', (fileInfo.size / 1024).toFixed(2), 'KB');
      console.log('파일 크기 (MB):', (fileInfo.size / (1024 * 1024)).toFixed(2), 'MB');
    } else {
      console.log('파일 크기: 알 수 없음');
    }
    
    if ('isDirectory' in fileInfo) {
      console.log('디렉토리 여부:', fileInfo.isDirectory);
    }
    
    if ('modificationTime' in fileInfo) {
      console.log('수정 시간:', fileInfo.modificationTime);
    }
    
    if (!fileInfo.exists || (fileInfo.exists && 'size' in fileInfo && fileInfo.size === 0)) {
      throw new Error('파일이 존재하지 않거나 크기가 0입니다.');
    }

    // ==============================
    // 파일 정보 추출
    // ==============================
    const localUri = processedImageUri; // 처리된 이미지 URI 사용
    const filename = 'medication.jpg'; // JPEG로 고정
    
    // JPEG 형식으로 고정
    const type = 'image/jpeg';

    console.log('=== 📄 파일 메타데이터 ===');
    console.log('파일명:', filename);
    console.log('MIME Type:', type);
    console.log('URI:', localUri);
    console.log('Local URL:', localUri);
    console.log('파일 크기:', fileInfo.exists && 'size' in fileInfo ? fileInfo.size : '알 수 없음', 'bytes');

    // ==============================
    // FormData 생성
    // ==============================
    const formData = new FormData();
    formData.append('mode', mode);
    
    // 이미지 파일 객체 생성 (React Native FormData 형식)
    const imageFile = {
      uri: localUri,
      name: filename,
      type: type,
    };
    
    formData.append('image', imageFile as any);

    console.log('=== 📦 FormData 생성 완료 ===');
    console.log('FormData 모드:', mode);
    console.log('FormData 이미지 객체:', {
      uri: imageFile.uri,
      name: imageFile.name,
      type: imageFile.type,
    });
    console.log('FormData 전체 내용 확인:');
    console.log('- mode:', mode);
    console.log('- image.uri:', imageFile.uri);
    console.log('- image.name:', imageFile.name);
    console.log('- image.type:', imageFile.type);
    console.log('- 파일 크기:', fileInfo.exists && 'size' in fileInfo ? fileInfo.size : '알 수 없음', 'bytes');

    // ==============================
    // API 요청 (axios)
    // api.post는 FormData를 자동으로 감지하여 multipart/form-data로 처리함
    // ==============================
    const response = await api.post<BaseResponse<MedicationCreateResponse>>(
      '/medications',
      formData,
      {
        timeout: 300000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log('업로드 응답:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('=== 업로드 실패 ===');
    console.error('에러 타입:', error.constructor.name);
    console.error('에러 메시지:', error.message);
    
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      console.error('요청 객체:', error.request);
    }
    
    console.error('전체 에러 객체:', error);

    throw error;
  } finally {
    isUploading = false;
  }
};


// ==============================
// 이하 GET / PATCH / PUT API
// ==============================
export const getMedicationDetail = async (
  umno: number
): Promise<BaseResponse<MedicationDetailResponse>> => {
  const res = await api.get(`/users/me/medications/${umno}`);
  return res.data;
};

export const updateMedicationCategory = async (
  umno: number,
  category: string
): Promise<BaseResponse<MedicationCategoryUpdateResponse>> => {
  const res = await api.patch(`/users/me/medications/${umno}`, { category });
  return res.data;
};

export const getMedicationSummary = async (
  umno: number
): Promise<BaseResponse<MedicationSummaryResponse>> => {
  const res = await api.get(`/users/me/medications/${umno}/summary`);
  return res.data;
};

export const getMedicationCombination = async (
  umno: number
): Promise<BaseResponse<MedicationCombinationResponse>> => {
  const res = await api.get(`/users/me/medications/${umno}/combination`);
  return res.data;
};

export const updateMedicationCombination = async (
  umno: number,
  combination: string
): Promise<BaseResponse<MedicationCombinationResponse>> => {
  const res = await api.put(`/users/me/medications/${umno}/combination`, {
    combination,
  });
  return res.data;
};

export const getMedicationTime = async (
  umno: number,
  type: string
): Promise<BaseResponse<MedicationTimeItem>> => {
  console.log(`[getMedicationTime] API 호출 시작 - umno: ${umno}, type: ${type}`);
  const res = await api.get(
    `/users/me/medications/${umno}/times?type=${type}`
  );
  console.log(`[getMedicationTime] API 응답 - resultCode: ${res.data?.header?.resultCode}, body:`, res.data?.body);
  return res.data;
};

export const updateMedicationTime = async (
  umno: number,
  atno: number,
  type: string,
  time: number
): Promise<BaseResponse<MedicationTimeUpdateResponse>> => {
  const res = await api.patch(
    `/users/me/medications/${umno}/times/${atno}`,
    { type, time }
  );
  return res.data;
};
