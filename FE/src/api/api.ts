import axios from 'axios';

// API Base URL 설정 (환경에 따라 변경 가능)
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // 개발 환경
  : 'https://api.example.com'; // 프로덕션 환경

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - 요청 전 처리
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있다면 헤더에 추가
    // const token = getToken(); // 토큰 가져오는 함수 (구현 필요)
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - 응답 후 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // 에러 처리
    if (error.response) {
      // 서버에서 응답이 온 경우
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 인증 실패 - 로그인 화면으로 이동 등
          console.error('[API Error] Unauthorized');
          // handleUnauthorized();
          break;
        case 403:
          console.error('[API Error] Forbidden');
          break;
        case 404:
          console.error('[API Error] Not Found');
          break;
        case 500:
          console.error('[API Error] Internal Server Error');
          break;
        default:
          console.error(`[API Error] ${status}`, data);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('[API Error] No response received', error.request);
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('[API Error] Request setup error', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API 메서드들
export const api = {
  // GET 요청
  get: <T = any>(url: string, config?: any) => {
    return apiClient.get<T>(url, config);
  },

  // POST 요청
  post: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT 요청
  put: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.put<T>(url, data, config);
  },

  // PATCH 요청
  patch: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.patch<T>(url, data, config);
  },

  // DELETE 요청
  delete: <T = any>(url: string, config?: any) => {
    return apiClient.delete<T>(url, config);
  },
};

// 기본 export
export default apiClient;
