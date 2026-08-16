import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceMode = 'direct' | 'proxy' | 'replay' | 'demo';

export const MAX_SELECTED_CARS = 8; // caps analytics chart legibility (categorical palette also has 8 slots)

interface SettingsState {
  dataSource: DataSourceMode;
  replayBase: string;
  proxyBase: string; // '' = same-origin '/api' (local dev via Vite proxy); else an absolute hosted URL
  focusedCar: string | null;
  carsShown: number;
  selectedCars: string[]; // insertion order = stable chart color assignment
  setDataSource: (mode: DataSourceMode) => void;
  setReplayBase: (base: string) => void;
  setProxyBase: (base: string) => void;
  setFocusedCar: (car: string | null) => void;
  setCarsShown: (n: number) => void;
  toggleSelectedCar: (car: string) => void;
  clearSelectedCars: () => void;
}

/** The subset written to localStorage — see `partialize` below. */
type PersistedSettings = Pick<
  SettingsState,
  'dataSource' | 'replayBase' | 'proxyBase' | 'carsShown' | 'selectedCars'
>;

// Build-time defaults (see web/client/.env / GitHub Actions workflow).
// VITE_PROXY_BASE lets a static deploy point "Live (proxy)" at a
// separately-hosted proxy server, since Pages can't run one itself. It is
// optional: 'direct' mode reads the NASCAR CDN straight from the browser.
const BUILD_PROXY_BASE = (import.meta.env.VITE_PROXY_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

const envDefault = (): DataSourceMode => {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (base === 'demo') return 'demo';
  if (base === 'direct') return 'direct';
  if (base === 'proxy') return 'proxy';
  if (base && base.includes('8080')) return 'replay';
  // Direct by default: it needs no server of any kind, so it works the same
  // on GitHub Pages as it does locally. Switchable in the TopBar.
  return 'direct';
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: envDefault(),
      replayBase: 'http://localhost:8080',
      proxyBase: BUILD_PROXY_BASE,
      focusedCar: null,
      carsShown: 40,
      selectedCars: [],
      setDataSource: (dataSource) => set({ dataSource }),
      setReplayBase: (replayBase) => set({ replayBase }),
      setProxyBase: (proxyBase) => set({ proxyBase: proxyBase.replace(/\/$/, '') }),
      setFocusedCar: (focusedCar) => set({ focusedCar }),
      setCarsShown: (carsShown) => set({ carsShown }),
      toggleSelectedCar: (car) =>
        set((s) => {
          if (s.selectedCars.includes(car)) {
            return { selectedCars: s.selectedCars.filter((c) => c !== car) };
          }
          if (s.selectedCars.length >= MAX_SELECTED_CARS) return s;
          return { selectedCars: [...s.selectedCars, car] };
        }),
      clearSelectedCars: () => set({ selectedCars: [] }),
    }),
    {
      name: 'nascar-tracker-settings',
      version: 1,
      // v0 browsers persisted dataSource: 'proxy', which only ever worked with
      // a proxy server reachable from that browser — on a static host it left
      // the app stuck on "start the proxy". 'direct' needs no server, so move
      // those sessions over; the proxy stays available in the TopBar selector.
      migrate: (persisted, version) => {
        const s = persisted as PersistedSettings;
        if (version < 1 && s?.dataSource === 'proxy') {
          return { ...s, dataSource: 'direct' };
        }
        return s;
      },
      partialize: (s) => ({
        dataSource: s.dataSource,
        replayBase: s.replayBase,
        proxyBase: s.proxyBase,
        carsShown: s.carsShown,
        selectedCars: s.selectedCars,
      }),
    },
  ),
);
