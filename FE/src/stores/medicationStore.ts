import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Medication {
  umno: number; // 사용자 복약 번호 (백엔드와 일치)
  category: string;
  hospital: string;
  taken: number; // 복약 횟수 (백엔드 필드명)
  startAt: string; // 시작일 (백엔드 필드명)
  timePeriods?: string[]; // 복약 시간대
}

interface MedicationState {
  medications: Medication[];
  selectedMedication: Medication | null;
  selectedUmno: number | null; // 현재 선택된 복약의 umno
  setMedications: (medications: Medication[]) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (umno: number, updates: Partial<Medication>) => void;
  deleteMedication: (umno: number) => void;
  setSelectedMedication: (medication: Medication | null) => void;
  setSelectedUmno: (umno: number | null) => void; // umno로 선택
  clearMedications: () => void; // 복약 목록 초기화
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      selectedMedication: null,
      selectedUmno: null,
      setMedications: (medications) => {
        console.log('[MedicationStore] 복약 목록 설정:', medications.length, '개');
        set({ medications });
      },
      addMedication: (medication) => {
        console.log('[MedicationStore] 복약 추가:', medication.umno);
        set((state) => ({
          medications: [...state.medications, medication],
        }));
      },
      updateMedication: (umno, updates) => {
        console.log('[MedicationStore] 복약 업데이트:', umno, updates);
        set((state) => ({
          medications: state.medications.map((med) =>
            med.umno === umno ? { ...med, ...updates } : med
          ),
          selectedMedication:
            state.selectedMedication?.umno === umno
              ? { ...state.selectedMedication, ...updates }
              : state.selectedMedication,
        }));
      },
      deleteMedication: (umno) => {
        console.log('[MedicationStore] 복약 삭제:', umno);
        set((state) => ({
          medications: state.medications.filter((med) => med.umno !== umno),
          selectedMedication:
            state.selectedMedication?.umno === umno
              ? null
              : state.selectedMedication,
          selectedUmno:
            state.selectedUmno === umno ? null : state.selectedUmno,
        }));
      },
      setSelectedMedication: (medication) => {
        console.log('[MedicationStore] 선택된 복약 설정:', medication?.umno || null);
        set({ 
          selectedMedication: medication,
          selectedUmno: medication?.umno || null,
        });
      },
      setSelectedUmno: (umno) => {
        console.log('[MedicationStore] 선택된 복약 umno 설정:', umno);
        const medication = get().medications.find((med) => med.umno === umno);
        set({ 
          selectedUmno: umno,
          selectedMedication: medication || null,
        });
      },
      clearMedications: () => {
        console.log('[MedicationStore] 복약 목록 초기화');
        set({ 
          medications: [],
          selectedMedication: null,
          selectedUmno: null,
        });
      },
    }),
    {
      name: 'medication-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 재수화(rehydrate) 완료 시 로그 출력
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[MedicationStore] ✅ 상태 복원 완료');
          console.log('[MedicationStore] 복약 개수:', state.medications.length);
          console.log('[MedicationStore] 선택된 복약:', state.selectedUmno || '없음');
        } else {
          console.log('[MedicationStore] 상태 복원 실패 또는 초기 상태');
        }
      },
    }
  )
);
