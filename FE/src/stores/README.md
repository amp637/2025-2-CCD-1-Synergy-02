# Stores

Zustand를 사용한 전역 상태 관리 스토어들입니다.

## 사용 방법

### Auth Store (인증)
```typescript
import { useAuthStore } from '../stores';

// 컴포넌트 내에서
const { token, isAuthenticated, login, logout } = useAuthStore();

// 로그인
login('your-token-here');

// 로그아웃
logout();
```

### User Store (사용자 정보)
```typescript
import { useUserStore } from '../stores';

// 컴포넌트 내에서
const { user, setUser, updateUser, clearUser } = useUserStore();

// 사용자 정보 설정
setUser({
  id: '1',
  name: '홍길동',
  phone: '010-1234-5678',
  birthdate: '1990-01-01',
});

// 사용자 정보 업데이트
updateUser({ name: '김철수' });

// 사용자 정보 초기화
clearUser();
```

### Medication Store (약물 정보)
```typescript
import { useMedicationStore } from '../stores';

// 컴포넌트 내에서
const { 
  medications, 
  selectedMedication,
  setMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  setSelectedMedication 
} = useMedicationStore();

// 약물 목록 설정
setMedications([...]);

// 약물 추가
addMedication({
  id: 1,
  category: '감기약',
  hospital: '가람병원',
  frequency: 2,
  startDate: '2025-01-01',
});

// 약물 업데이트
updateMedication(1, { frequency: 3 });

// 약물 삭제
deleteMedication(1);

// 선택된 약물 설정
setSelectedMedication(medication);
```

## 주의사항

- `authStore`와 `userStore`는 `persist` 미들웨어를 사용하여 AsyncStorage에 자동으로 저장됩니다.
- `medicationStore`는 메모리에만 저장되며, 앱을 재시작하면 초기화됩니다.
- 필요에 따라 `medicationStore`에도 `persist` 미들웨어를 추가할 수 있습니다.

