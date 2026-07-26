import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceMode = 'proxy' | 'replay' | 'demo';

interface SettingsState {
  dataSource: DataSourceMode;
  replayBase: string;
  proxyBase: string; // '' = same-origin '/api' (local dev via Vite proxy); else an absolute hosted URL
  focusedCar: string | null;
  carsShown: number;
  setDataSource: (mode: DataSourceMode) => void;
  setReplayBase: (base: string) => void;
  setProxyBase: (base: string) => void;
  setFocusedCar: (car: string | null) => void;
  setCarsShown: (n: number) => void;
}

// Build-time defaults (see web/client/.env / GitHub Actions workflow).
// VITE_PROXY_BASE lets a static deploy (GitHub Pages) point "Live (proxy)"
// at a separately-hosted proxy server, since Pages can't run one itself.
const BUILD_PROXY_BASE = (import.meta.env.VITE_PROXY_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

const envDefault = (): DataSourceMode => {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (base === 'demo') return 'demo';
  if (base === 'proxy' || BUILD_PROXY_BASE) return 'proxy';
  if (base && base.includes('8080')) return 'replay';
  return 'demo'; // demo by default so the app works with zero setup; switchable in TopBar
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: envDefault(),
      replayBase: 'http://localhost:8080',
      proxyBase: BUILD_PROXY_BASE,
      focusedCar: null,
      carsShown: 40,
      setDataSource: (dataSource) => set({ dataSource }),
      setReplayBase: (replayBase) => set({ replayBase }),
      setProxyBase: (proxyBase) => set({ proxyBase: proxyBase.replace(/\/$/, '') }),
      setFocusedCar: (focusedCar) => set({ focusedCar }),
      setCarsShown: (carsShown) => set({ carsShown }),
    }),
    {
      name: 'nascar-tracker-settings',
      partialize: (s) => ({
        dataSource: s.dataSource,
        replayBase: s.replayBase,
        proxyBase: s.proxyBase,
        carsShown: s.carsShown,
      }),
    },
  ),
);
