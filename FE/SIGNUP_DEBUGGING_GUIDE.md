# 회원가입 API 디버깅 가이드

## 🔧 수정된 파일들

### 1. `FE/src/api/api.ts`
- **timeout**: 300초 → 10초로 단축 (빠른 타임아웃 감지)
- **request interceptor**: 상세한 네트워크 요청 로깅 추가
- **response interceptor**: 상세한 네트워크 응답 로깅 추가
- **error interceptor**: 타임아웃, 네트워크 에러 구분 로깅

### 2. `FE/src/api/authApi.ts`
- **signUp 함수**: 간소화 및 상세 로깅 추가
- **에러 처리**: 네트워크 에러 vs 서버 에러 구분
- **타임아웃 감지**: ECONNABORTED 에러 코드 감지

### 3. `FE/src/screens/onboarding/OnboardingSignUp.tsx`
- **FCM 토큰 테스트 모드**: 실제 토큰 vs 테스트 토큰 전환 가능
- **상세 로깅**: 요청/응답 시간, 데이터 크기, 소요 시간 측정
- **에러 분석**: 네트워크 에러 유형별 상세 정보

## 🧪 디버깅 절차

### 단계 1: FCM 토큰 테스트 모드 활성화

```typescript
// OnboardingSignUp.tsx 파일에서
const USE_TEST_FCM_TOKEN = true; // false → true로 변경
```

**목적**: FCM 토큰이 문제인지 확인

### 단계 2: 회원가입 시도 및 로그 확인

회원가입 버튼을 누르고 콘솔에서 다음 로그 순서를 확인:

#### 2-1. FCM 토큰 상태 확인
```
🔍 === FCM 토큰 상태 확인 ===
📍 테스트 모드: 활성화 (테스트 토큰 사용)
📍 원본 FCM 토큰: eb3af8a98b6a0edfca7d47532d94d99801309973f4a7a23aa4...
📍 사용할 토큰: test-token-12345
```

#### 2-2. 요청 준비
```
📤 === 회원가입 요청 준비 ===
📍 요청 시간: 2025-11-27T...
📍 요청 URL: POST http://15.165.38.252:8080/users
📍 요청 데이터: {
  "name": "홍길동",
  "birth": "1990-01-01",
  "phone": "01012345678",
  "fcm_token": "test-token-12345"
}
```

#### 2-3. signUp 함수 시작
```
🚀 === signUp 함수 시작 ===
📍 함수 호출 시간: 2025-11-27T...
📍 요청할 URL: POST http://15.165.38.252:8080/users
📍 FCM 토큰 길이: 17
```

#### 2-4. axios 요청 인터셉터
```
🌐 === API 요청 시작 ===
📍 요청 URL: /users
📍 요청 메서드: POST
📍 전체 URL: http://15.165.38.252:8080/users
📍 타임아웃: 10000ms
📍 요청 시간: 2025-11-27T...
📦 요청 데이터 (회원가입):
  - 데이터 타입: object
  - 데이터 크기: 123 bytes
```

### 단계 3: 응답/에러 분석

#### 성공 케이스
```
✅ === API 응답 수신 ===
📍 응답 URL: /users
📍 응답 상태: 200 OK
📍 응답 데이터: {
  "header": {
    "resultCode": 1000,
    "resultMsg": "회원가입에 성공하였습니다."
  },
  "body": {
    "uno": 123
  }
}
```

#### 타임아웃 케이스
```
❌ === API 에러 발생 ===
📍 에러 메시지: timeout of 10000ms exceeded
📍 에러 코드: ECONNABORTED
📍 타임아웃 에러: 서버 응답이 10초 내에 오지 않음
```

#### 네트워크 에러 케이스
```
❌ === API 에러 발생 ===
📍 에러 메시지: Network Error
📍 에러 코드: NETWORK_ERROR
📍 네트워크 연결 에러: 인터넷 연결 또는 서버 접근 불가
```

#### 서버 에러 케이스
```
❌ === API 에러 발생 ===
📍 응답 상태: 400 Bad Request
📍 응답 데이터: {
  "header": {
    "resultCode": 4000,
    "resultMsg": "잘못된 요청입니다."
  }
}
```

## 🔍 문제 진단 체크리스트

### 1. 요청이 아예 안 나가는 경우
- [ ] `🚀 signUp API 호출 시작...` 로그가 보이는가?
- [ ] `🌐 === API 요청 시작 ===` 로그가 보이는가?

**해결**: JavaScript 에러 또는 함수 호출 문제

### 2. 요청은 나가지만 응답이 안 오는 경우
- [ ] `🌐 === API 요청 시작 ===` 로그는 보이는가?
- [ ] 10초 후 타임아웃 에러가 발생하는가?

**해결**: 서버 문제 또는 네트워크 문제

### 3. 서버에서 에러 응답이 오는 경우
- [ ] `✅ === API 응답 수신 ===` 로그가 보이는가?
- [ ] `resultCode`가 1000이 아닌가?

**해결**: 요청 데이터 형식 문제 또는 서버 로직 문제

## 🧪 테스트 시나리오

### 시나리오 A: FCM 토큰 문제 확인
1. `USE_TEST_FCM_TOKEN = true` 설정
2. 회원가입 시도
3. 성공하면 → FCM 토큰이 문제
4. 실패하면 → 다른 원인

### 시나리오 B: 네트워크 연결 확인
1. 브라우저에서 `http://15.165.38.252:8080` 접속 시도
2. 접속 안 되면 → 서버 다운 또는 네트워크 문제
3. 접속 되면 → 앱 설정 문제

### 시나리오 C: 요청 데이터 확인
1. 콘솔에서 `📦 요청 데이터` 로그 확인
2. JSON 형식이 올바른지 확인
3. 필드 순서가 `name → birth → phone → fcm_token` 인지 확인

## 🔧 추가 디버깅 도구

### React Native Debugger 사용
```bash
# React Native Debugger 설치
brew install --cask react-native-debugger

# 실행
react-native-debugger
```

### Network 탭에서 확인
1. Expo Go에서 Shake gesture
2. "Debug Remote JS" 선택
3. Chrome DevTools → Network 탭
4. 회원가입 시도 후 `/users` 요청 확인

### Flipper 사용 (선택사항)
```bash
# Flipper 설치
brew install --cask flipper

# Network Inspector 플러그인으로 HTTP 요청 모니터링
```

## 🚨 자주 발생하는 문제들

### 1. 타임아웃 (10초)
**원인**: 서버 응답 지연 또는 서버 다운
**해결**: 서버 상태 확인, 네트워크 연결 확인

### 2. Network Error
**원인**: 인터넷 연결 끊김, 서버 접근 불가
**해결**: WiFi/모바일 데이터 확인, 서버 URL 확인

### 3. 400 Bad Request
**원인**: 요청 데이터 형식 오류
**해결**: JSON 구조, 필드명, 데이터 타입 확인

### 4. FCM 토큰 길이 문제
**원인**: 서버에서 긴 FCM 토큰 처리 불가
**해결**: 테스트 토큰으로 확인 후 백엔드 수정 요청

## 📞 최종 체크포인트

회원가입이 계속 pending 상태라면:

1. **10초 후 타임아웃 에러가 발생하는가?**
   - YES → 서버 문제
   - NO → JavaScript 에러 또는 무한 루프

2. **`🌐 === API 요청 시작 ===` 로그가 보이는가?**
   - YES → 네트워크 문제
   - NO → 앱 내부 문제

3. **테스트 토큰으로 시도했을 때도 같은 현상인가?**
   - YES → FCM 토큰 무관
   - NO → FCM 토큰 문제

이 가이드를 따라 단계별로 확인하시면 정확한 원인을 찾을 수 있습니다! 🎯

