"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  getTradeTheme,
  setTradeTheme as persistTradeTheme,
  type TradeTheme,
} from "@/lib/storage";

type Ctx = {
  theme: TradeTheme;
  setTheme: (t: TradeTheme) => void;
  toggle: () => void;
};

const TradeThemeContext = createContext<Ctx>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

export function TradeThemeProvider({
  children,
  onThemeChange,
}: {
  children: React.ReactNode;
  onThemeChange?: (theme: TradeTheme) => void;
}) {
  const [theme, setThemeState] = useState<TradeTheme>("light");

  useLayoutEffect(() => {
    const t = getTradeTheme();
    setThemeState(t);
    onThemeChange?.(t);
  }, [onThemeChange]);

  const setTheme = useCallback(
    (t: TradeTheme) => {
      persistTradeTheme(t);
      setThemeState(t);
      onThemeChange?.(t);
    },
    [onThemeChange]
  );

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return (
    <TradeThemeContext.Provider value={value}>
      {children}
    </TradeThemeContext.Provider>
  );
}

export function useTradeTheme() {
  return useContext(TradeThemeContext);
}
