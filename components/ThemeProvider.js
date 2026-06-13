"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/* eslint-disable react/prop-types */
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

