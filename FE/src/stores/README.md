# Stores

Zustand를 사용한 전역 상태 관리 스토어들입니다.

## 사용 방법

### Auth Store (인증)
```typescript
import { useAuthStore } from '../stores';

// 컴포넌트 내에서
const { token, isAuthenticated, uno, login, logout, checkToken } = useAuthStore();

// 로그인
login('your-token-here', uno);

// 로그아웃
logout();

// 토큰 확인
const token = checkToken();
```

### User Store (사용자 정보)
```typescript
import { useUserStore } from '../stores';

// 컴포넌트 내에서
const { user, setUser, updateUser, clearUser, setUserFromApi } = useUserStore();

// 사용자 정보 설정
setUser({
  uno: 1,
  name: '홍길동',
  phone: '01012345678',
  birth: '1990-01-01',
});

// API 응답으로부터 사용자 정보 설정 (완전 덮어쓰기)
setUserFromApi(uno, name, phone, birth);

// 사용자 정보 업데이트
updateUser({ name: '김철수' });

// 사용자 정보 초기화
clearUser();
```

### Medication Store (복약 정보)
```typescript
import { useMedicationStore } from '../stores';

// 컴포넌트 내에서
const { 
  medications, 
  selectedMedication,
  selectedUmno,
  setMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  setSelectedMedication,
  setSelectedUmno,
  clearMedications
} = useMedicationStore();

// 복약 목록 설정
setMedications([...]);

// 복약 추가
addMedication({
  umno: 1,
  category: '감기약',
  hospital: '가람병원',
  taken: 2,
  startAt: '2025-01-01',
});

// 복약 업데이트
updateMedication(umno, { taken: 3 });

// 복약 삭제
deleteMedication(umno);

// 선택된 복약 설정
setSelectedMedication(medication);
// 또는 umno로 설정
setSelectedUmno(umno);
```

## 주의사항

- **모든 스토어는 `persist` 미들웨어를 사용하여 AsyncStorage에 자동으로 저장됩니다.**
- 앱을 재시작해도 상태가 유지됩니다.
- `logout()` 호출 시 모든 스토어가 함께 초기화됩니다.
- `setUserFromApi`는 완전히 덮어쓰기 방식으로 동작하여 이전 사용자 정보가 잔존하지 않습니다.

## 상태 복원 (Rehydration)

앱 시작 시 persist 미들웨어가 AsyncStorage에서 상태를 복원합니다. 콘솔에서 다음 로그를 확인할 수 있습니다:

- `[AuthStore] ✅ 상태 복원 완료`
- `[UserStore] ✅ 상태 복원 완료`
- `[MedicationStore] ✅ 상태 복원 완료`

## 문제 해결

### 상태가 저장되지 않는 경우
1. AsyncStorage 권한 확인
2. 콘솔 로그에서 에러 메시지 확인
3. `npx expo start --clear`로 캐시 클리어 후 재시작

### 순환 참조 오류
- `logout()` 시 다른 스토어 초기화는 `setTimeout`으로 감싸져 있어 순환 참조가 발생하지 않습니다.

### 토큰이 저장되지 않는 경우
- `login()` 호출 후 약간의 지연(100ms) 후 `checkToken()`으로 확인하세요.
- persist 미들웨어는 비동기적으로 저장되므로 즉시 확인 시 아직 저장되지 않았을 수 있습니다.

// 또는 umno로 설정
setSelectedUmno(umno);
```

## 주의사항

- **모든 스토어는 `persist` 미들웨어를 사용하여 AsyncStorage에 자동으로 저장됩니다.**
- 앱을 재시작해도 상태가 유지됩니다.
- `logout()` 호출 시 모든 스토어가 함께 초기화됩니다.
- `setUserFromApi`는 완전히 덮어쓰기 방식으로 동작하여 이전 사용자 정보가 잔존하지 않습니다.

## 상태 복원 (Rehydration)

앱 시작 시 persist 미들웨어가 AsyncStorage에서 상태를 복원합니다. 콘솔에서 다음 로그를 확인할 수 있습니다:

- `[AuthStore] ✅ 상태 복원 완료`
- `[UserStore] ✅ 상태 복원 완료`
- `[MedicationStore] ✅ 상태 복원 완료`

## 문제 해결

### 상태가 저장되지 않는 경우
1. AsyncStorage 권한 확인
2. 콘솔 로그에서 에러 메시지 확인
3. `npx expo start --clear`로 캐시 클리어 후 재시작

### 순환 참조 오류
- `logout()` 시 다른 스토어 초기화는 `setTimeout`으로 감싸져 있어 순환 참조가 발생하지 않습니다.

### 토큰이 저장되지 않는 경우
- `login()` 호출 후 약간의 지연(100ms) 후 `checkToken()`으로 확인하세요.
- persist 미들웨어는 비동기적으로 저장되므로 즉시 확인 시 아직 저장되지 않았을 수 있습니다.
