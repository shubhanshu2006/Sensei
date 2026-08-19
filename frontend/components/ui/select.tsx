"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  error?: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error,
      label,
      id,
      options,
      placeholder = "Select...",
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || "");

    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Hidden native select for form compatibility */}
          <select
            ref={ref}
            id={id}
            value={selectedValue}
            onChange={(e) => handleSelect(e.target.value)}
            className="sr-only"
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom styled select */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors",
              "hover:border-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
              error && "border-rose-500 focus:ring-rose-500",
              !selectedValue && "text-slate-400",
              className,
            )}
            disabled={props.disabled}
          >
            <span>{selectedOption?.label || placeholder}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown */}
          {isOpen && !props.disabled && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 flex items-center justify-between transition-colors",
                      selectedValue === option.value &&
                        "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    <span>{option.label}</span>
                    {selectedValue === option.value && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-rose-600 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
