import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceMode = 'proxy' | 'replay' | 'demo';

interface SettingsState {
  dataSource: DataSourceMode;
  replayBase: string;
  focusedCar: string | null;
  carsShown: number;
  setDataSource: (mode: DataSourceMode) => void;
  setReplayBase: (base: string) => void;
  setFocusedCar: (car: string | null) => void;
  setCarsShown: (n: number) => void;
}

const envDefault = (): DataSourceMode => {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (base === 'demo') return 'demo';
  if (base && base.includes('8080')) return 'replay';
  return 'demo'; // demo by default so the app works with zero setup; switchable in TopBar
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: envDefault(),
      replayBase: 'http://localhost:8080',
      focusedCar: null,
      carsShown: 40,
      setDataSource: (dataSource) => set({ dataSource }),
      setReplayBase: (replayBase) => set({ replayBase }),
      setFocusedCar: (focusedCar) => set({ focusedCar }),
      setCarsShown: (carsShown) => set({ carsShown }),
    }),
    {
      name: 'nascar-tracker-settings',
      partialize: (s) => ({ dataSource: s.dataSource, replayBase: s.replayBase, carsShown: s.carsShown }),
    },
  ),
);
