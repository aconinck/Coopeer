import { useState, useEffect } from 'react';
import { getMockTeams } from '../services/api';
import type { Team } from '../types';
import type { SportId } from '../constants/theme';

interface TeamsState {
  teams: Team[];
  loading: boolean;
  error: string | null;
}

interface UseTeamsOptions {
  latitude: number | null;
  longitude: number | null;
  sport?: SportId | 'all';
}

export function useTeams({ latitude, longitude, sport = 'all' }: UseTeamsOptions): TeamsState {
  const [state, setState] = useState<TeamsState>({
    teams: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (latitude === null || longitude === null) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    getMockTeams(latitude, longitude)
      .then((teams) => {
        const filtered = sport === 'all'
          ? teams
          : teams.filter((t) => t.sport.id === sport);
        setState({ teams: filtered, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ teams: [], loading: false, error: err.message });
      });
  }, [latitude, longitude, sport]);

  return state;
}
