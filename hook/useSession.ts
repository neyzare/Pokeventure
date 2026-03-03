import { useCallback, useEffect, useState } from "react";
import { getMeAction } from "@/app/actions/auth";

type MeResult =
  | { isLoggedIn: false }
  | {
      isLoggedIn: true;
      user: { id: string; email: string; username: string | null };
    };

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResult>({ isLoggedIn: false });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMeAction();
      setMe(res);
    } catch {
      setMe({ isLoggedIn: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    isLoggedIn: me.isLoggedIn,
    user: me.isLoggedIn ? me.user : null,
    refresh,
  };
}
