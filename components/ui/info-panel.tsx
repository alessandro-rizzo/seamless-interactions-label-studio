"use client";

import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export interface InfoPanelProps {
  trigger: ReactNode;
  title: string;
  description: string;
  items: Array<{
    label: string;
    description: string;
  }>;
}

export function InfoPanel({
  trigger,
  title,
  description,
  items,
}: InfoPanelProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="
            fixed inset-0
            bg-black/50
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            z-50
          "
        />

        <Dialog.Content
          className="
            fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
            max-h-[85vh] w-[90vw] max-w-[600px]
            bg-background border rounded-lg shadow-lg
            focus:outline-none
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
            data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
            z-50
          "
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-2">
                {description}
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="
                  rounded-sm opacity-70
                  ring-offset-background
                  transition-opacity
                  hover:opacity-100
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  disabled:pointer-events-none
                "
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          {items.length > 0 && (
            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="text-sm font-medium">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
