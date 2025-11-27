import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { useMedicationStore } from './medicationStore';

interface AuthState {
  token: string | null;
  uno: number | null; // 사용자 번호
  isAuthenticated: boolean;
  login: (token: string, uno?: number) => void;
  logout: () => void;
  checkToken: () => string | null;
  setUno: (uno: number) => void; // uno 설정 메서드
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      uno: null,
      isAuthenticated: false,
      login: (token: string, uno?: number) => {
        console.log('[AuthStore] 🔥 토큰 저장 시작:', token.substring(0, 30) + '...');
        console.log('[AuthStore] 토큰 길이:', token.length);
        if (uno) {
          console.log('[AuthStore] 사용자 번호 (uno):', uno);
        }
        
        // 상태 업데이트 (persist 미들웨어가 자동으로 AsyncStorage에 저장)
        set({ token, isAuthenticated: true, uno: uno || null });
        
        // 저장 후 확인 (비동기 저장이므로 약간의 지연 후 확인)
        setTimeout(() => {
          const savedToken = get().token;
          if (savedToken && savedToken === token) {
            console.log('[AuthStore] ✅ 토큰 저장 성공:', savedToken.substring(0, 30) + '...');
          } else {
            console.warn('[AuthStore] ⚠️ 토큰 저장 확인 중... (비동기 저장 대기 중)');
          }
        }, 100);
      },
      logout: () => {
        console.log('[AuthStore] 로그아웃 - 토큰 및 사용자 정보 삭제');
        set({ token: null, uno: null, isAuthenticated: false });
        
        // 다른 store도 함께 초기화 (순환 참조 방지를 위해 setTimeout 사용)
        setTimeout(() => {
          try {
            useUserStore.getState().clearUser();
            useMedicationStore.getState().clearMedications();
            console.log('[AuthStore] 모든 store 초기화 완료');
          } catch (error) {
            console.error('[AuthStore] 다른 store 초기화 중 오류:', error);
          }
        }, 0);
      },
      setUno: (uno: number) => {
        console.log('[AuthStore] 사용자 번호 설정:', uno);
        set({ uno });
      },
      checkToken: () => {
        const token = get().token;
        const isAuth = get().isAuthenticated;
        console.log('[AuthStore] 토큰 확인:', token ? token.substring(0, 30) + '...' : '없음');
        console.log('[AuthStore] 인증 상태:', isAuth);
        return token;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 재수화(rehydrate) 완료 시 로그 출력
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[AuthStore] ✅ 상태 복원 완료');
          console.log('[AuthStore] 토큰 존재:', !!state.token);
          console.log('[AuthStore] 인증 상태:', state.isAuthenticated);
          console.log('[AuthStore] 사용자 번호:', state.uno);
        } else {
          console.log('[AuthStore] 상태 복원 실패 또는 초기 상태');
        }
      },
    }
  )
);



