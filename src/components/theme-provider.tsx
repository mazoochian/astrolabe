import {
  createContext,
  createEffect,
  createSignal,
  onMount,
  useContext,
  type ParentProps,
} from "solid-js";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: ParentProps) {
  const [theme, setTheme] = createSignal<Theme>("dark");

  onMount(() => {
    const stored = localStorage.getItem("astrolabe-theme") as Theme | null;
    if (stored) setTheme(stored);
  });

  createEffect(() => {
    document.documentElement.classList.toggle("dark", theme() === "dark");
    localStorage.setItem("astrolabe-theme", theme());
  });

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
