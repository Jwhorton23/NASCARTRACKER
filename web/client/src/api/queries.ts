import { useQuery } from '@tanstack/react-query';
import type { FlagEvent, LiveFeed, PointsEntry, StagePointsFeed } from '@nascar/shared';
import { fetchLive } from './dataSource';
import { useSettings } from '../state/settingsStore';

/** 1 s heartbeat — the whole app hangs off this feed. */
export function useLiveFeed() {
  const dataSource = useSettings((s) => s.dataSource);
  return useQuery<LiveFeed>({
    queryKey: ['live-feed', dataSource],
    queryFn: () => fetchLive<LiveFeed>('feed'),
    refetchInterval: 1000,
    staleTime: 500,
    retry: 1,
    refetchIntervalInBackground: false,
  });
}

export function useFlagData() {
  const dataSource = useSettings((s) => s.dataSource);
  return useQuery<FlagEvent[]>({
    queryKey: ['flag-data', dataSource],
    queryFn: () => fetchLive<FlagEvent[]>('flags'),
    refetchInterval: 5000,
    retry: 1,
  });
}

export function usePitData() {
  const dataSource = useSettings((s) => s.dataSource);
  return useQuery<unknown>({
    queryKey: ['pit-data', dataSource],
    queryFn: () => fetchLive<unknown>('pits'),
    refetchInterval: 3000,
    retry: 1,
  });
}

export function usePoints() {
  const dataSource = useSettings((s) => s.dataSource);
  return useQuery<PointsEntry[]>({
    queryKey: ['points', dataSource],
    queryFn: () => fetchLive<PointsEntry[]>('points'),
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useStagePoints() {
  const dataSource = useSettings((s) => s.dataSource);
  return useQuery<StagePointsFeed[] | StagePointsFeed>({
    queryKey: ['stage-points', dataSource],
    queryFn: () => fetchLive<StagePointsFeed[] | StagePointsFeed>('stagePoints'),
    refetchInterval: 10000,
    retry: 1,
  });
}
