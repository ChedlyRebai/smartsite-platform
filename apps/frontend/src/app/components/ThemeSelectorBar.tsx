import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { themes } from '@/app/context/themes';
import { X } from 'lucide-react';

export function ThemeSelectorBar() {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themeList = Object.entries(themes).map(([key, theme]) => ({
    key: key as keyof typeof themes,
    theme,
  }));

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 top-6 z-50 p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition hover:shadow-xl"
        title="Open theme selector"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8.5c.83 0 1.5-.67 1.5-1.5S15.83 8 15 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-6 0c.83 0 1.5-.67 1.5-1.5S9.83 8 9 8 7.5 8.67 7.5 9.5 8.17 11 9 11z" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full z-40 bg-white shadow-2xl transition-all duration-300 overflow-y-auto ${
          isOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Theme Palette</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-blue-500/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="p-4 space-y-3">
          {themeList.map(({ key, theme }) => (
            <button
              key={key}
              onClick={() => {
                setTheme(key);
                setIsOpen(false);
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                currentTheme === key
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Theme Preview */}
              <div className="flex items-start gap-3 w-full">
                <div className="flex gap-2 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-8 h-8 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.success }}
                    title="Success"
                  />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-gray-900">{theme.label}</p>
                  <p className="text-xs text-gray-500">{theme.description}</p>
                </div>
                {currentTheme === key && (
                  <div className="flex-shrink-0 text-blue-500">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-gray-50 to-transparent border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            12 Professional Themes Available
          </p>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
          role="presentation"
          onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }}
        />
      )}
    </>
  );
}
