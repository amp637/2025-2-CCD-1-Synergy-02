# FCM 푸시 알림 + 회원가입 연동 테스트 가이드

## 구현 완료 사항

### 1. Axios 공통 모듈 (`src/api/api.ts`)
- ✅ baseURL: `http://15.165.38.252:8080`
- ✅ 응답 인터셉터: Authorization 헤더에서 JWT 토큰 자동 추출 및 AsyncStorage 저장
- ✅ 요청 인터셉터: AsyncStorage에서 토큰 자동 첨부 (회원가입/로그인 제외)

### 2. Zustand AuthStore (`src/stores/authStore.ts`)
- ✅ FCM 토큰 전역 상태 관리 (`fcmToken: string | null`)
- ✅ `setFcmToken(token: string)`: FCM 토큰 저장 (zustand + AsyncStorage)
- ✅ `initializeFcmToken()`: 앱 시작 시 저장된 FCM 토큰 복원

### 3. OnboardingWelcomeScreen (`src/screens/onboarding/OnboardingWelcomeScreen.tsx`)
- ✅ "시작하기" 버튼 클릭 시 푸시 알림 권한 요청
- ✅ 권한 허용 시 FCM 토큰 발급 및 AuthStore에 저장
- ✅ 권한 거부 시 사용자 안내 후 계속 진행
- ✅ iOS/Android 호환 (expo-notifications + expo-device 사용)

### 4. OnboardingSignUp (`src/screens/onboarding/OnboardingSignUp.tsx`)
- ✅ AuthStore에서 FCM 토큰 가져와서 회원가입 요청에 포함
- ✅ 백엔드 스펙에 맞는 요청 형식: `{ name, phone, birth, fcm_token }`
- ✅ FCM 토큰이 없으면 빈 문자열로 전송

### 5. App.tsx
- ✅ 앱 시작 시 FCM 토큰 초기화 (`initializeFcmToken()` 호출)

## 테스트 시나리오

### 시나리오 A: 정상 플로우 (권한 허용)

1. **앱 초기화**
   ```bash
   # 앱 삭제 후 재설치 (권한 초기화)
   # Expo Go에서 앱 실행
   ```

2. **OnboardingWelcomeScreen 진입**
   - 앱 실행 → "시작하기" 버튼 표시
   - 버튼 클릭 시 "권한 요청 중..." 텍스트로 변경

3. **푸시 알림 권한 허용**
   - iOS: "알림을 허용하시겠습니까?" → "허용" 선택
   - Android: 알림 권한 다이얼로그 → "허용" 선택

4. **FCM 토큰 발급 확인**
   ```javascript
   // 콘솔에서 확인할 로그:
   "✅ FCM 토큰 발급 성공: ExponentPushToken[xxxxxx]..."
   "[AuthStore] FCM 토큰 저장: ExponentPushToken[xxxxxx]..."
   "[AuthStore] ✅ FCM 토큰 AsyncStorage 저장 완료"
   ```

5. **회원가입 화면에서 정보 입력**
   - 이름: "홍길동"
   - 생년월일: "1990-01-01"
   - 전화번호: "010-1234-5678"
   - "회원가입" 버튼 클릭

6. **회원가입 API 요청 확인**
   ```javascript
   // 콘솔에서 확인할 로그:
   "FCM 토큰 상태: ExponentPushToken[xxxxxx]..."
   "회원가입 데이터 (정규화 후): { name: '홍길동', phone: '01012345678', birth: '1990-01-01' }"
   
   // 네트워크 탭에서 확인:
   // POST http://15.165.38.252:8080/users
   // Request Body:
   {
     "name": "홍길동",
     "phone": "01012345678", 
     "birth": "1990-01-01",
     "fcm_token": "ExponentPushToken[xxxxxx]..."
   }
   ```

7. **JWT 토큰 저장 확인**
   ```javascript
   // 콘솔에서 확인할 로그:
   "=== 응답 인터셉터: 토큰 발견 (성공 응답) ==="
   "[AuthStore] 🔥 토큰 저장 시작: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   "✅ 토큰 저장 완료, uno: 123"
   
   // AsyncStorage 확인:
   // AsyncStorage.getItem('accessToken') → JWT 토큰 존재
   ```

### 시나리오 B: 권한 거부

1. **앱 초기화**
   ```bash
   # 앱 삭제 후 재설치 (권한 초기화)
   # Expo Go에서 앱 실행
   ```

2. **OnboardingWelcomeScreen 진입**
   - "시작하기" 버튼 클릭

3. **푸시 알림 권한 거부**
   - iOS: "알림을 허용하시겠습니까?" → "허용 안 함" 선택
   - Android: 알림 권한 다이얼로그 → "거부" 선택

4. **권한 거부 안내**
   ```javascript
   // 표시되는 Alert:
   "알림 권한"
   "푸시 알림 권한이 거부되었습니다.\n설정에서 언제든 변경할 수 있습니다."
   ```

5. **회원가입 진행**
   - 이름, 생년월일, 전화번호 입력 후 "회원가입" 클릭

6. **FCM 토큰 없이 회원가입 확인**
   ```javascript
   // 콘솔에서 확인할 로그:
   "FCM 토큰 상태: 없음"
   
   // 네트워크 탭에서 확인:
   // POST http://15.165.38.252:8080/users
   // Request Body:
   {
     "name": "홍길동",
     "phone": "01012345678",
     "birth": "1990-01-01", 
     "fcm_token": ""  // 빈 문자열
   }
   ```

7. **정상 회원가입 완료**
   - JWT 토큰 저장 및 홈 화면 이동 확인

## 디버깅 도구

### 1. 콘솔 로그 확인
```javascript
// FCM 토큰 관련 로그
"✅ FCM 토큰 발급 성공"
"⚠️ FCM 토큰 발급 실패 또는 권한 거부"
"[AuthStore] FCM 토큰 저장"

// 회원가입 API 관련 로그
"회원가입 API 호출 중..."
"FCM 토큰 상태: ..."
"회원가입 데이터 (정규화 후): ..."

// JWT 토큰 관련 로그
"=== 응답 인터셉터: 토큰 발견 ==="
"[AuthStore] 🔥 토큰 저장 시작"
```

### 2. AsyncStorage 확인
```javascript
// React Native Debugger 또는 Flipper에서 확인
AsyncStorage.getItem('fcmToken')     // FCM 토큰
AsyncStorage.getItem('accessToken')  // JWT 토큰
```

### 3. 네트워크 요청 확인
- Expo Go: Shake gesture → "Debug Remote JS" → Chrome DevTools Network 탭
- 또는 React Native Debugger 사용

## 주의사항

### 1. Expo Go 환경
- 실제 기기에서만 푸시 알림 테스트 가능 (시뮬레이터 불가)
- Expo 푸시 토큰 형식: `ExponentPushToken[xxxxxx]`

### 2. 프로젝트 ID
- 현재 하드코딩된 프로젝트 ID: `7c1b8b8e-4b5a-4b5a-8b5a-4b5a8b5a4b5a`
- 실제 Expo 프로젝트 ID로 변경 필요

### 3. 백엔드 연동
- 백엔드 서버: `http://15.165.38.252:8080`
- 회원가입 API: `POST /users`
- 응답 헤더에 `Authorization: Bearer <JWT>` 포함 필요

## 문제 해결

### FCM 토큰 발급 실패
```javascript
// 로그 확인:
"Expo 푸시 토큰 발급 실패: ..."
"디바이스 푸시 토큰 발급도 실패: ..."

// 해결 방법:
1. 실제 기기에서 테스트 (시뮬레이터 불가)
2. 네트워크 연결 확인
3. Expo Go 앱 최신 버전 사용
```

### 회원가입 API 실패
```javascript
// 로그 확인:
"[API ERROR] 400/500 ..."

// 해결 방법:
1. 백엔드 서버 상태 확인
2. 요청 데이터 형식 확인 (name, phone, birth, fcm_token)
3. 네트워크 연결 확인
```

### JWT 토큰 저장 실패
```javascript
// 로그 확인:
"[응답 인터셉터] 성공 응답이지만 Authorization 헤더 없음"

// 해결 방법:
1. 백엔드에서 응답 헤더에 Authorization 포함 확인
2. resultCode가 1000인지 확인
```
