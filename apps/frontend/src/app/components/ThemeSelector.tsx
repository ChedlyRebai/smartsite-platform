import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes, getThemeKey, type ThemeName } from '@/app/context/themes';
import { Palette, Moon, Sun } from 'lucide-react';

export function ThemeSelector() {
  const { currentTheme, currentMode, setTheme, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleMode}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-200"
        title={currentMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {currentMode === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5 text-amber-400" />
        )}
      </button>

      {/* Color Palette Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-200"
          title="Change theme palette"
        >
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Theme</span>
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
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 px-3 py-2">
                  Color Palettes ({currentMode})
                </p>
              </div>

              <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                {['blue', 'green', 'purple', 'slate', 'navy'].map((themeName) => {
                  const themeKey = getThemeKey(themeName as ThemeName, currentMode);
                  const theme = themes[themeKey];
                  return (
                    <button
                      key={themeKey}
                      onClick={() => {
                        setTheme(themeName as ThemeName);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-3 ${
                        currentTheme === themeName
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {/* Color Preview */}
                      <div className="flex gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.colors.success }}
                        />
                      </div>
                      <span className="text-sm font-medium">{theme.label}</span>
                      {currentTheme === themeName && (
                        <span className="ml-auto text-xs font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
