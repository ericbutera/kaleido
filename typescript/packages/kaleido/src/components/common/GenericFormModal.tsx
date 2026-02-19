import type { ReactNode } from "react";
import type { FieldValues, UseFormHandleSubmit } from "react-hook-form";

export interface GenericFormModalProps<TFormData extends FieldValues> {
  // Modal state
  isOpen: boolean;
  title: string;

  // Form handling
  handleSubmit: UseFormHandleSubmit<TFormData>;
  isSubmitting: boolean;
  isSaving?: boolean; // Additional saving state for multi-step operations
  uploadProgress?: number; // 0-100 for upload progress
  onSave: (
    data: TFormData,
    callbacks: { onClose?: () => void }
  ) => Promise<void>;

  // Modal actions
  onClose: () => void;
  onCancel?: () => void;

  // Render functions
  children: ReactNode;

  // Optional customization
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  submitLabel?: string;
  cancelLabel?: string;
}

export default function GenericFormModal<TFormData extends FieldValues>({
  isOpen,
  title,
  handleSubmit,
  isSubmitting,
  isSaving = false,
  uploadProgress,
  onSave,
  onClose,
  onCancel,
  children,
  maxWidth = "2xl",
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: GenericFormModalProps<TFormData>) {
  if (!isOpen) return null;

  const isLoading = isSubmitting || isSaving;

  const handleCancel = () => {
    // Prevent closing during save operations
    if (isLoading) return;

    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const maxWidthClass = `max-w-${maxWidth}`;

  return (
    <div className="modal modal-open" onClick={handleCancel}>
      <div
        className={`modal-box ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg mb-4">
          {title}
          {isLoading && (
            <span className="loading loading-spinner loading-xs ml-2"></span>
          )}
        </h3>

        {uploadProgress !== undefined &&
          uploadProgress > 0 &&
          uploadProgress < 100 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm font-semibold">{uploadProgress}%</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={uploadProgress}
                max="100"
              ></progress>
            </div>
          )}

        <form onSubmit={handleSubmit((data) => onSave(data, { onClose }))}>
          {children}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
