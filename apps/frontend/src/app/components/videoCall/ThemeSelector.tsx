import { useThemeStore } from "@/app/store/themeStore";
import { THEMES } from "@/app/types";
import { PaletteIcon } from "lucide-react";


const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      {/* DROPDOWN TRIGGER */}
      <button tabIndex={0} className="btn btn-ghost btn-circle">
        <PaletteIcon className="size-5" />
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-56 border border-base-content/10 max-h-80 overflow-y-auto"
      >
        <div className="space-y-1">
         
        </div>
      </div>
    </div>
  );
};
export default ThemeSelector;
