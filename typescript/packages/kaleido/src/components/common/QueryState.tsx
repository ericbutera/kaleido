import type { ComponentProps, ReactNode } from "react";
import { handleApiError } from "../../lib/apiHelpers";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function errorMessage(error: unknown, fallback: string) {
  if (error == null) {
    return fallback;
  }

  return handleApiError(error).message || fallback;
}

export function LoadingSpinner({
  size = "md",
  className,
  ...props
}: ComponentProps<"span"> & {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <span
      className={cx("loading loading-spinner", `loading-${size}`, className)}
      {...props}
    />
  );
}

export function CenteredLoading({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div className={cx("flex justify-center py-8", className)}>
      <LoadingSpinner size={size} />
    </div>
  );
}

export function ApiErrorAlert({
  error,
  fallback = "Request failed",
  className,
  children,
}: {
  error?: unknown;
  fallback?: string;
  className?: string;
  children?: ReactNode;
}) {
  const baseClassName = className?.includes("alert-error")
    ? "alert"
    : "alert alert-error";

  return (
    <div className={cx(baseClassName, className)}>
      {children ?? <span>{errorMessage(error, fallback)}</span>}
    </div>
  );
}

export function ApiMutationErrors({
  errors,
  className,
}: {
  errors: Array<unknown | false | null | undefined>;
  className?: string;
}) {
  return (
    <>
      {errors.map((error, index) =>
        error ? (
          <ApiErrorAlert key={index} error={error} className={className} />
        ) : null,
      )}
    </>
  );
}

export function QueryStateCard({
  children,
  className,
  bodyClassName,
}: {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("card bg-base-100 shadow-xl", className)}>
      <div className={cx("card-body", bodyClassName)}>{children}</div>
    </section>
  );
}

export function LoadingCard({
  size = "md",
  className,
  bodyClassName = "items-center py-10",
}: {
  size?: SpinnerSize;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <QueryStateCard className={className} bodyClassName={bodyClassName}>
      <LoadingSpinner size={size} />
    </QueryStateCard>
  );
}

export function ErrorCard({
  error,
  fallback,
  className,
  bodyClassName,
}: {
  error?: unknown;
  fallback?: string;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <QueryStateCard className={className} bodyClassName={bodyClassName}>
      <ApiErrorAlert error={error} fallback={fallback} />
    </QueryStateCard>
  );
}
