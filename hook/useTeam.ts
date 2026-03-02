import { useCallback, useEffect, useState } from "react";
import { getMyTeam } from "../telefunc/team.telefunc";

export function useTeam(enabled: boolean) {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Array<{ pokemonId: number }>>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyTeam();
      if (res.success) setTeam(res.team);
      else setTeam([]);
    } catch {
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setTeam([]);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { loading, team, refresh };
}
