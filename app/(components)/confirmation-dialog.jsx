"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";

export const ConfirmationDialog = ({
  children,
  title,
  description,
  onConfirm,
  ...props
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-gray-800 p-6 shadow-lg border border-gray-700 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="text-lg font-semibold text-gray-100">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm text-gray-300">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-6 flex justify-end space-x-3">
            <DialogPrimitive.Close
              className={`px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-gray-100 hover:bg-gray-600 transition-colors`}
            >
              Cancel
            </DialogPrimitive.Close>
            <DialogPrimitive.Close
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors`}
            >
              Confirm
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
            <FiX className="h-5 w-5 text-gray-400" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
