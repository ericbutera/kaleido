import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import toast from "react-hot-toast";
import type { ApiError } from "./queries";

/**
 * Maps structured API errors to React Hook Form fields.
 * Also shows a generic toast for the main message.
 */
export function handleFormError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fallbackMsg: string = "An error occurred", showToast: boolean = true) {
  const apiErr = err as ApiError;

  // 1. Map field-level errors to react-hook-form
  if (apiErr?.errors) {
    Object.entries(apiErr.errors).forEach(([field, messages]) => {
      // Note: We use messages[0] as RHF usually shows one error at a time
      setError(field as Path<T>, {
        type: "server",
        message: messages[0],
      });
    });
  }

  if (showToast) {
    const message = apiErr?.message || fallbackMsg;
    toast.error(message);
  }
}
