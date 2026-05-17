import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/context/themes';
import { Check, ChevronDown, Search } from 'lucide-react';

export function ThemeButton() {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const themeList = Object.entries(themes).map(([key, theme]) => ({
    key: key as keyof typeof themes,
    theme,
  }));

  const filteredThemes = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themeList;
    return themeList.filter(({ theme, key }) => {
      return (
        theme.label.toLowerCase().includes(q) ||
        theme.description.toLowerCase().includes(q) ||
        String(key).toLowerCase().includes(q)
      );
    });
  }, [query, themeList]);

  const current = themes[currentTheme];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition"
        title="Change theme"
        aria-label={`Change theme (current: ${currentTheme})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8.5c.83 0 1.5-.67 1.5-1.5S15.83 8 15 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-6 0c.83 0 1.5-.67 1.5-1.5S9.83 8 9 8 7.5 8.67 7.5 9.5 8.17 11 9 11z" />
        </svg>
        <span className="hidden sm:inline">Theme</span>
        {current?.label && (
          <span className="hidden lg:inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
            {current.label}
          </span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          role="presentation"
          onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }}
          />

          {/* Dropdown Menu */}
          <div
            className="absolute right-0 mt-2 w-[22rem] bg-card text-foreground rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
            role="dialog"
            aria-label="Theme selector"
          >
            <div className="p-3 border-b border-border bg-card/80 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Color palettes
                </p>
                <span className="text-xs text-muted-foreground">
                  {filteredThemes.length}/{themeList.length}
                </span>
              </div>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search theme..."
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-2 max-h-96 overflow-y-auto">
              {filteredThemes.map(({ key, theme }) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-3",
                    "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40",
                    currentTheme === key ? "bg-muted ring-1 ring-border" : "",
                  ].join(" ")}
                >
                  {/* Color Preview */}
                  <div className="flex gap-1.5">
                    <div
                      className="w-4 h-4 rounded-md shadow-sm border border-black/5"
                      style={{ backgroundColor: theme.colors.primary }}
                      aria-hidden="true"
                    />
                    <div
                      className="w-4 h-4 rounded-md shadow-sm border border-black/5"
                      style={{ backgroundColor: theme.colors.accent }}
                      aria-hidden="true"
                    />
                    <div
                      className="w-4 h-4 rounded-md shadow-sm border border-black/5"
                      style={{ backgroundColor: theme.colors.success }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{theme.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {theme.description}
                    </p>
                  </div>
                  {currentTheme === key && (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))}
              {filteredThemes.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  No themes match “{query.trim()}”.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
