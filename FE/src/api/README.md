# API

Axios를 사용한 API 클라이언트 설정입니다.

## 사용 방법

### 기본 사용
```typescript
import { api } from '../api/api';

// GET 요청
const response = await api.get('/users');
const data = response.data;

// POST 요청
const response = await api.post('/users', {
  name: '홍길동',
  phone: '010-1234-5678',
});

// PUT 요청
const response = await api.put('/users/1', {
  name: '김철수',
});

// PATCH 요청
const response = await api.patch('/users/1', {
  phone: '010-9999-8888',
});

// DELETE 요청
const response = await api.delete('/users/1');
```

### 타입 안전성
```typescript
interface User {
  id: string;
  name: string;
  phone: string;
}

// 타입 지정
const response = await api.get<User>('/users/1');
const user: User = response.data;
```

## 설정

### Base URL 변경
`src/api/api.ts` 파일에서 `BASE_URL`을 수정하세요:
```typescript
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // 개발 환경
  : 'https://api.example.com'; // 프로덕션 환경
```

### 인증 토큰 추가
`src/api/api.ts`의 Request Interceptor에서 주석 처리된 부분을 활성화하고 토큰을 가져오는 함수를 구현하세요:
```typescript
// 토큰 가져오는 함수 구현 필요
const getToken = () => {
  // 예: useAuthStore에서 가져오기
  return useAuthStore.getState().token;
};

// Interceptor에서
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

## Interceptors

### Request Interceptor
- 모든 요청 전에 실행됩니다.
- 토큰을 헤더에 추가하거나 로깅을 수행할 수 있습니다.

### Response Interceptor
- 모든 응답 후에 실행됩니다.
- 에러 처리 및 로깅을 수행합니다.
- 401 에러 시 인증 실패 처리를 추가할 수 있습니다.

