import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';

// ====================================================
//  BASE URL 설정
// ====================================================
const IP = "15.165.38.252";
const BASE_URL = `http://${IP}:8080`;

export const API_BASE_URL = BASE_URL;

// ====================================================
//  axios 인스턴스 생성
// ====================================================
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    Accept: 'application/json',
  },
});

// ====================================================
//  REQUEST INTERCEPTOR (단순 & 안전 버전)
// ====================================================
apiClient.interceptors.request.use(
  (config) => {
    // 🔍 회원가입 및 로그인 API는 토큰을 포함하지 않음
    const isSignUpRequest = config.url === '/users' && config.method?.toUpperCase() === 'POST';
    const isLoginRequest = config.url === '/auth/login' && config.method?.toUpperCase() === 'POST';
    
    const authStore = useAuthStore.getState();
    const token = authStore.token;
    const uno = authStore.uno;
    
    // 🔍 토큰 및 헤더 로깅
    console.log('=== API 요청 인터셉터 ===');
    console.log('요청 URL:', config.url);
    console.log('요청 메서드:', config.method?.toUpperCase());
    console.log('전체 URL:', config.baseURL + config.url);
    console.log('[인증 상태] UNO:', uno, '| 토큰 존재:', !!token);
    
    if (isSignUpRequest) {
      console.log('회원가입 요청 감지 → 토큰 제외');
    } else if (isLoginRequest) {
      console.log('로그인 요청 감지 → 토큰 제외');
    } else {
      // 인증이 필요한 요청
      if (token) {
        const tokenPreview = token.length > 50 ? token.substring(0, 50) + '...' : token;
        console.log('[토큰 정보]');
        console.log('  - 토큰 길이:', token.length);
        console.log('  - 토큰 미리보기:', tokenPreview);
        console.log('  - 토큰 형식 확인:', token.startsWith('eyJ') ? 'JWT 형식 ✅' : '⚠️ JWT 형식 아님');
        
        // Bearer 토큰 설정
        const bearerToken = `Bearer ${token}`;
        config.headers.Authorization = bearerToken;
        
        console.log('[Authorization 헤더]');
        console.log('  - 설정 완료 ✅');
        console.log('  - 헤더 값 (처음 60자):', bearerToken.substring(0, 60) + '...');
        console.log('  - Bearer 접두사 확인:', bearerToken.startsWith('Bearer ') ? '✅' : '❌');
        
        // 헤더에 실제로 설정되었는지 확인
        if (config.headers.Authorization) {
          console.log('  - 최종 확인: 헤더에 Authorization 존재 ✅');
        } else {
          console.error('  - ❌ 헤더에 Authorization이 설정되지 않았습니다!');
        }
      } else {
        console.error('[토큰 오류]');
        console.error('  - ❌ 토큰이 없습니다!');
        console.error('  - ❌ 이 요청은 인증 없이 전송됩니다!');
        console.error('  - AuthStore 상태:', {
          token: authStore.token,
          uno: authStore.uno,
          isAuthenticated: !!authStore.token
        });
      }
    }

    // 🔥 FormData 감지 → Content-Type 삭제
    const isFormData =
      config.data instanceof FormData ||
      Object.prototype.toString.call(config.data) === '[object FormData]';

    if (isFormData) {
      // FormData인 경우 maxBodyLength, maxContentLength 설정
      config.maxBodyLength = Infinity;
      config.maxContentLength = Infinity;

      console.log("🔥 FormData 감지됨 → transformRequest로 처리");
      console.log('최종 헤더:', JSON.stringify(config.headers, null, 2));
      return config;
    }

    // JSON 요청일 때만 설정
    config.headers['Content-Type'] = 'application/json';
    
    // 최종 헤더 확인
    console.log('[최종 요청 헤더]');
    const finalHeaders = { ...config.headers };
    if (finalHeaders.Authorization) {
      const authHeader = finalHeaders.Authorization as string;
      finalHeaders.Authorization = authHeader.substring(0, 60) + '... (토큰 일부)';
    }
    console.log(JSON.stringify(finalHeaders, null, 2));
    console.log('========================');

    return config;
  },
  (error) => {
    console.error('요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// ====================================================
//  RESPONSE INTERCEPTOR
// ====================================================
apiClient.interceptors.response.use(
  (response) => {
    // 🔍 응답 헤더에서 토큰 추출하여 저장 (로그인/회원가입 성공 시에만)
    // ⚠️ 중요: axios는 헤더 키를 모두 소문자로 변환함
    // ⚠️ 중요: resultCode가 1000일 때만 토큰 저장 (성공 응답만 처리)
    const resultCode = response.data?.header?.resultCode;
    
    // 회원가입/로그인 성공일 때만 토큰 저장
    if (resultCode === 1000) {
      const authHeader = response.headers['authorization'] || response.headers.authorization;
      
      if (authHeader) {
        console.log('=== 응답 인터셉터: 토큰 발견 (성공 응답) ===');
        console.log('Authorization 헤더:', authHeader.substring(0, 30) + '...');
        
        // Bearer 접두사 제거
        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : authHeader;
        
        console.log('토큰 추출 완료 (처음 30자):', token.substring(0, 30) + '...');
        
        // 응답 body에서 uno 추출 (있는 경우)
        const uno = response.data?.body?.uno;
        
        if (!token || token.trim() === '') {
          console.error('[응답 인터셉터] ⚠️ 토큰이 비어있습니다!');
          return response;
        }
        
        // AuthStore에 토큰 저장
        useAuthStore.getState().login(token, uno);
        console.log('✅ 토큰 저장 완료, uno:', uno);
      } else {
        console.log('[응답 인터셉터] 성공 응답이지만 Authorization 헤더 없음');
      }
    } else {
      console.log(`[응답 인터셉터] resultCode: ${resultCode} - 토큰 저장하지 않음`);
    }
    
    return response;
  },
  (error) => {
    console.error('=== API 응답 에러 ===');
    console.error('에러 상태:', error.response?.status);
    console.error('에러 데이터:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response) {
      console.error("[API ERROR]", error.response.status, error.response.data);

      if (error.response.status === 401) {
        console.warn('401 Unauthorized - 로그아웃 처리');
        useAuthStore.getState().logout();
      }
    } else if (error.request) {
      console.error('요청은 보냈지만 응답을 받지 못함');
    } else {
      console.error('요청 설정 중 에러:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ====================================================
//  Export API 메서드
// ====================================================
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.get<T>(url, config);
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    // FormData인 경우 transformRequest 추가 (RN에서 FormData가 문자열로 변환되는 것 방지)
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      const finalConfig: any = {
        ...config,
        headers: {
          ...config?.headers,
          'content-type': 'multipart/form-data',
        },
        transformRequest: (data: any, headers?: any) => {
          // FormData인 경우 그대로 반환 (문자열로 변환 방지)
          return data;
        },
      };
      return apiClient.post<T>(url, data, finalConfig);
    }
    
    // JSON 데이터인 경우 기본 동작 사용 (axios가 자동으로 JSON.stringify 처리)
    return apiClient.post<T>(url, data, config);
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      const finalConfig: any = {
        ...config,
        transformRequest: (data: any) => {
          return data;
        },
      };
      return apiClient.put<T>(url, data, finalConfig);
    }
    
    return apiClient.put<T>(url, data, config);
  },
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      const finalConfig: any = {
        ...config,
        transformRequest: (data: any) => {
          return data;
        },
      };
      return apiClient.patch<T>(url, data, finalConfig);
    }
    
    return apiClient.patch<T>(url, data, config);
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.delete<T>(url, config);
  },
};

export default apiClient;
