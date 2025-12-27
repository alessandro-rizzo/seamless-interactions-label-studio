"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, ChevronDown, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getTriggerText = () => {
    if (value.length === 0) {
      return placeholder;
    }

    // Get labels for all selected values
    const selectedLabels = value
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean);

    return selectedLabels.join(", ");
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`
            flex items-center justify-between gap-2 w-full
            px-3 py-2 border rounded-lg bg-background
            text-sm text-left
            transition-colors
            hover:bg-accent
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={placeholder}
          title={getTriggerText()}
        >
          <span
            className={`
              truncate
              ${value.length === 0 ? "text-muted-foreground" : ""}
            `}
          >
            {getTriggerText()}
          </span>
          <ChevronDown
            size={16}
            className="text-muted-foreground flex-shrink-0"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="
            w-[var(--radix-popover-trigger-width)]
            max-h-[400px]
            p-2
            bg-background border rounded-lg shadow-lg
            overflow-hidden
            z-50
          "
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="
                  flex items-start gap-2 px-2 py-2
                  rounded hover:bg-accent
                  cursor-pointer
                  transition-colors
                "
              >
                <Checkbox.Root
                  checked={value.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                  className="
                    flex items-center justify-center
                    w-4 h-4
                    mt-0.5
                    border rounded
                    bg-background
                    data-[state=checked]:bg-primary
                    data-[state=checked]:border-primary
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    flex-shrink-0
                  "
                >
                  <Checkbox.Indicator>
                    <Check size={12} className="text-primary-foreground" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {value.length > 0 && (
            <>
              <div className="h-px bg-border my-2" />
              <button
                type="button"
                onClick={handleClearAll}
                className="
                  flex items-center justify-center gap-2 w-full
                  px-2 py-1.5
                  text-sm text-muted-foreground
                  rounded hover:bg-accent hover:text-foreground
                  transition-colors
                "
              >
                <X size={14} />
                Clear all
              </button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
