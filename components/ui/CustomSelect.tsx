'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Selecciona una opción...',
  ariaLabel = 'Select',
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <SelectPrimitive.Root key={value} value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className="inline-flex w-full items-center justify-between rounded-2xl border border-[#352C56] bg-[#141124] px-4 py-2.5 text-sm text-white font-medium shadow-sm transition-colors hover:border-[#6967EB] focus:outline-none focus:border-[#6967EB] cursor-pointer"
      >
        <span className="flex items-center gap-2 text-white truncate flex-1 text-left">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-[#787196] truncate">{placeholder}</span>
          )}
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-[#9D96B8] transition-transform duration-200 shrink-0 ml-2" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] max-h-64 overflow-hidden rounded-2xl border border-[#352C56] bg-[#1E1834] text-white shadow-2xl animate-in fade-in-80 zoom-in-95 duration-100"
        >
          <SelectPrimitive.Viewport className="p-1.5 space-y-1 custom-scrollbar">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#C5C0DC] outline-none select-none transition-colors data-[highlighted]:bg-[#272041] data-[highlighted]:text-white data-[state=checked]:text-white data-[state=checked]:font-bold cursor-pointer"
              >
                <SelectPrimitive.ItemText>
                  <span className="flex items-center gap-2">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="h-4 w-4 text-[#00CAFA]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};
