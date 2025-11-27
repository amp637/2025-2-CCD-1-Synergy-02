import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  uno: number; // 사용자 번호 (백엔드와 일치)
  name: string;
  phone: string;
  birth: string; // 백엔드는 "birth" 필드명 사용
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  // 사용자 정보 조회 및 저장
  setUserFromApi: (uno: number, name?: string, phone?: string, birth?: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: User) => {
        console.log('[UserStore] 사용자 정보 설정:', user);
        set({ user });
      },
      updateUser: (updates: Partial<User>) => {
        console.log('[UserStore] 사용자 정보 업데이트:', updates);
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      clearUser: () => {
        console.log('[UserStore] 사용자 정보 초기화');
        set({ user: null });
      },
      setUserFromApi: (uno: number, name?: string, phone?: string, birth?: string) => {
        // 🔥 부분 업데이트 대신 완전히 덮어쓰기 (이전 사용자 정보 잔존 방지)
        const updatedUser: User = {
          uno,
          name: name ?? '',
          phone: phone ?? '',
          birth: birth ?? '',
        };
        console.log('[UserStore] API 응답으로부터 사용자 정보 설정 (완전 덮어쓰기):', updatedUser);
        set({ user: updatedUser });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 재수화(rehydrate) 완료 시 로그 출력
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[UserStore] ✅ 상태 복원 완료');
          console.log('[UserStore] 사용자 정보:', state.user ? `${state.user.name} (uno: ${state.user.uno})` : '없음');
        } else {
          console.log('[UserStore] 상태 복원 실패 또는 초기 상태');
        }
      },
    }
  )
);

