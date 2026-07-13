import { useEffect } from 'react';
import { flagName } from '@nascar/shared';

/** Stamps the current flag state onto <html data-flag> so CSS re-themes the app. */
export function useFlagTheme(flagState: number | undefined) {
  useEffect(() => {
    document.documentElement.dataset.flag = flagName(flagState ?? 0);
  }, [flagState]);
}
