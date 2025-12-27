"use client";

import { MultiSelect, type MultiSelectOption } from "./ui/multi-select";
import type { Facet } from "@/lib/annotation-ontology";

export interface FacetSelectorProps {
  facet: Facet;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function FacetSelector({
  facet,
  value,
  onChange,
  disabled = false,
}: FacetSelectorProps) {
  // Convert signals to multi-select options with descriptions
  const options: MultiSelectOption[] = facet.signals.map((signal) => ({
    value: signal.id,
    label: signal.label,
    description: signal.description,
  }));

  return (
    <div className="space-y-2">
      {/* Facet label */}
      <label className="text-sm font-medium">{facet.label}</label>

      {/* Multi-select dropdown */}
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select signals..."
        disabled={disabled}
      />
    </div>
  );
}
