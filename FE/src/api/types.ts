// 백엔드 BaseResponse 형식에 맞춘 공통 응답 타입
// 백엔드는 header와 body 구조를 사용합니다
export interface BaseResponse<T> {
  header: {
    resultCode: number;
    resultMsg: string;
  };
  body: T | null;
}

