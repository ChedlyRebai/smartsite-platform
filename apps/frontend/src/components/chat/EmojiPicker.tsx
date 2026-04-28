import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '../ui/button';
import { Smile } from 'lucide-react';

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export default function EmojiPickerComponent({ onEmojiSelect, disabled = false }: EmojiPickerComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title="Ajouter un emoji"
        className="h-9 w-9 p-0"
      >
        <Smile className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-lg border bg-white"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            previewConfig={{
              showPreview: false
            }}
            skinTonesDisabled
            searchDisabled={false}
            categories={[
              'smileys_people',
              'animals_nature', 
              'food_drink',
              'travel_places',
              'activities',
              'objects',
              'symbols'
            ]}
          />
        </div>
      )}
    </div>
  );
}