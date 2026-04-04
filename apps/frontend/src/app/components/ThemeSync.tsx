import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";

/** Applique la classe `dark` sur <html> selon le thème persisté. */
export default function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
