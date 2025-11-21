# API 연동 가이드

## 생성된 API 함수들

### 1. userApi.ts
- `setMedicationTime(tno)` - 복약 시간 설정 (온보딩)
- `getMedicationTime(type)` - 복약 시간 조회
- `updateMedicationTime(utno, request)` - 복약 시간 수정
- `updateUserInfo(request)` - 사용자 정보 수정
- `getUserInfo()` - 사용자 정보 조회

### 2. presetApi.ts
- `getMedicationTimePresets(type)` - 복약 시간 프리셋 조회

### 3. medicationApi.ts
- `uploadMedication(mode, imageUri)` - 처방전/약봉투 업로드

## 타입 매핑

백엔드 type 값:
- `"breakfast"` - 아침
- `"lunch"` - 점심
- `"dinner"` - 저녁
- `"night"` - 취침전

## 사용 예시

### Onboarding 화면 (복약 시간 설정)
```typescript
import { setMedicationTime } from '../../api/userApi';
import { getMedicationTimePresets } from '../../api/presetApi';

// 1. 프리셋 조회
const presets = await getMedicationTimePresets('breakfast');
// presets.data.times 배열에서 시간 선택

// 2. 시간 설정
const response = await setMedicationTime(selectedTno);
```

### Edit 화면 (복약 시간 수정)
```typescript
import { getMedicationTime, updateMedicationTime } from '../../api/userApi';

// 1. 기존 시간 조회
const currentTime = await getMedicationTime('breakfast');

// 2. 시간 수정
const response = await updateMedicationTime(utno, {
  type: 'breakfast',
  time: 7 // 시간 (0-23)
});
```

### Prescription 화면 (처방전 업로드)
```typescript
import { uploadMedication } from '../../api/medicationApi';

// 이미지 업로드
const response = await uploadMedication('1', imageUri); // '1' = 처방전, '2' = 약봉투
```

### UserInfoEdit 화면 (사용자 정보 수정)
```typescript
import { getUserInfo, updateUserInfo } from '../../api/userApi';

// 1. 사용자 정보 조회
const userInfo = await getUserInfo();

// 2. 사용자 정보 수정
const response = await updateUserInfo({
  uno: userInfo.data.uno,
  name: name,
  birth: birthdate,
  phone: phone
});
```

