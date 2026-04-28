import { useState, useEffect } from "react";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TextSizeButton() {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('text-size') as 'small' | 'medium' | 'large' | null;
    if (saved) {
      setFontSize(saved);
      applyFontSize(saved);
    }
  }, []);

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;

    // Remove existing size classes
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');

    // Add new size class
    root.classList.add(`text-size-${size}`);

    // Store in localStorage
    localStorage.setItem('text-size', size);

    console.log(`Text size changed to: ${size}`);
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    applyFontSize(size);
  };

  const getSizeLabel = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'Petit';
      case 'medium': return 'Normal';
      case 'large': return 'Grand';
    }
  };

  const getSizeIcon = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md"
          aria-label="Taille du texte"
          title="Taille du texte"
        >
          <Type className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium mb-2">Taille du texte</p>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <Button
              key={size}
              variant={fontSize === size ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleSizeChange(size)}
            >
              <span className={`mr-2 ${getSizeIcon(size)}`}>
                Aa
              </span>
              {getSizeLabel(size)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
