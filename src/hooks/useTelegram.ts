/**
 * Thin Telegram WebApp helper.
 * Validates nothing client-side for auth — backend must verify initData.
 */

import { useEffect, useMemo, useState } from "react";

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        themeParams: Record<string, string>;
        colorScheme: "light" | "dark";
        initData: string;
        initDataUnsafe: {
          user?: TgUser;
          start_param?: string;
        };
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          setText: (t: string) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: string) => void;
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export function useTelegram() {
  const [ready, setReady] = useState(false);

  const webApp = useMemo(() => window.Telegram?.WebApp, []);

  useEffect(() => {
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
        webApp.setHeaderColor("#0f1115");
        webApp.setBackgroundColor("#0f1115");
      } catch {
        /* outside Telegram */
      }
      setReady(true);
    } else {
      setReady(true);
    }
  }, [webApp]);

  const user = webApp?.initDataUnsafe?.user;
  const initData = webApp?.initData || "";
  const colorScheme = webApp?.colorScheme || "dark";

  return {
    ready,
    webApp,
    user,
    initData,
    colorScheme,
    isTelegram: Boolean(webApp),
  };
}
