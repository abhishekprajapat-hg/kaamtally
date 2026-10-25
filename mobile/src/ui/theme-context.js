import React, { createContext, useContext } from 'react';
import { THEMES, makeResolver } from '../theme';

const Ctx = createContext(null);
export function ThemeProvider({ mode, children }) {
  const tk = THEMES[mode] || THEMES.light;
  const value = React.useMemo(() => ({ mode, tk, c: makeResolver(tk) }), [mode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
