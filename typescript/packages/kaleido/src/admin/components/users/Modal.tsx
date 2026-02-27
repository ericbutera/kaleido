import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { handleFormError } from "../../../auth/lib/form";
import type { User, UserFormData } from "../../../users/useUsers";
import {
  useCreateUser,
  useDisableUserAccount,
  useResendConfirmationEmail,
  useResendForgotPassword,
  useUpdateUser,
  useUser,
} from "../../../users/useUsers";

interface ModalProps {
  mode: "create" | "edit" | null;
  selectedUser: User | null;
  onClose: () => void;
}

const EMPTY_USER_FORM: UserFormData = {
  email: "",
  name: "",
  password: "",
  is_admin: false,
};

function getUserId(user: User | null): string | null {
  if (!user || user.id == null) return null;
  return String(user.id);
}

function isUserDisabled(user: User | null): boolean {
  if (!user) return false;
  return !!(user.disabled ?? user.is_disabled ?? user.active === false);
}

export default function Modal({ mode, selectedUser, onClose }: ModalProps) {
  const selectedUserId = getUserId(selectedUser);
  const detailQuery = useUser(mode === "edit" ? selectedUserId : null);
  const detailUser = detailQuery.data ?? selectedUser;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resendForgotPassword = useResendForgotPassword();
  const resendConfirmationEmail = useResendConfirmationEmail();
  const disableUserAccount = useDisableUserAccount();

  const [accountDisabled, setAccountDisabled] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: EMPTY_USER_FORM,
  });

  const isOpen = mode !== null;
  const isCreate = mode === "create";

  useEffect(() => {
    if (!isOpen) return;

    if (isCreate) {
      reset(EMPTY_USER_FORM);
      setAccountDisabled(false);
      return;
    }

    reset({
      email: String(detailUser?.email ?? ""),
      name: String(detailUser?.name ?? ""),
      password: "",
      is_admin: !!detailUser?.is_admin,
    });
    setAccountDisabled(isUserDisabled(detailUser));
  }, [detailUser, isCreate, isOpen, reset]);

  const pending = useMemo(
    () =>
      createUser.isPending ||
      updateUser.isPending ||
      resendForgotPassword.isPending ||
      resendConfirmationEmail.isPending ||
      disableUserAccount.isPending,
    [
      createUser.isPending,
      disableUserAccount.isPending,
      resendConfirmationEmail.isPending,
      resendForgotPassword.isPending,
      updateUser.isPending,
    ],
  );

  const isBusy = pending || isSubmitting;

  if (!isOpen) return null;
  if (!isCreate && !selectedUserId) return null;

  const handleSave = async (data: UserFormData) => {
    try {
      if (isCreate) {
        await createUser.mutateAsync({
          email: data.email,
          name: data.name || undefined,
          password: data.password || undefined,
          is_admin: data.is_admin,
        });
        toast.success("User created");
      } else {
        await updateUser.mutateAsync({
          id: selectedUserId!,
          data: {
            email: data.email,
            name: data.name || undefined,
            is_admin: data.is_admin,
          },
        });
        toast.success("User updated");
      }

      onClose();
    } catch (err) {
      console.error("Failed to save user", err);
      handleFormError(err, setError, "Failed to save user");
    }
  };

  const handleResendForgotPassword = async () => {
    if (!selectedUserId) return;

    try {
      await resendForgotPassword.mutateAsync({ id: selectedUserId });
      toast.success("Password reset email sent");
    } catch (err) {
      console.error("Failed to send password reset email", err);
      toast.error("Failed to send password reset email");
    }
  };

  const handleResendConfirmEmail = async () => {
    if (!selectedUserId) return;

    try {
      await resendConfirmationEmail.mutateAsync({ id: selectedUserId });
      toast.success("Confirmation email sent");
    } catch (err) {
      console.error("Failed to send confirmation email", err);
      toast.error("Failed to send confirmation email");
    }
  };

  const handleDisableAccount = async () => {
    if (!selectedUserId) return;

    try {
      await disableUserAccount.mutateAsync({
        id: selectedUserId,
        disabled: true,
      });
      setAccountDisabled(true);
      toast.success("User account disabled");
    } catch (err) {
      console.error("Failed to disable user account", err);
      toast.error("Failed to disable user account");
    }
  };

  return (
    <div className="modal modal-open" role="dialog" onClick={onClose}>
      <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">
          {isCreate ? "Create User" : `Edit User #${selectedUserId}`}
        </h3>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              {...register("email", {
                required: "Email is required",
              })}
              required
              disabled={isBusy}
            />
            {errors.email && (
              <span className="text-error text-sm mt-1">
                {typeof errors.email.message === "string"
                  ? errors.email.message
                  : "Invalid email"}
              </span>
            )}
          </label>

          <label className="form-control w-full">
            <span className="label-text">Name</span>
            <input
              type="text"
              className="input input-bordered w-full"
              {...register("name")}
              disabled={isBusy}
            />
            {errors.name && (
              <span className="text-error text-sm mt-1">
                {typeof errors.name.message === "string"
                  ? errors.name.message
                  : "Invalid name"}
              </span>
            )}
          </label>

          {isCreate && (
            <label className="form-control w-full">
              <span className="label-text">Temporary Password (optional)</span>
              <input
                type="text"
                className="input input-bordered w-full"
                {...register("password")}
                disabled={isBusy}
              />
              {errors.password && (
                <span className="text-error text-sm mt-1">
                  {typeof errors.password.message === "string"
                    ? errors.password.message
                    : "Invalid password"}
                </span>
              )}
            </label>
          )}

          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              {...register("is_admin")}
              disabled={isBusy}
            />
            <span className="label-text">Admin user</span>
          </label>

          {!isCreate && (
            <div className="rounded-lg border border-base-300 p-3 space-y-2">
              <div className="text-sm font-semibold">Account Actions</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleResendForgotPassword}
                  disabled={isBusy}
                >
                  (Re)send Forgot Password
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleResendConfirmEmail}
                  disabled={isBusy}
                >
                  Resend Confirm Email
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  onClick={handleDisableAccount}
                  disabled={isBusy || accountDisabled}
                >
                  {accountDisabled ? "Account Disabled" : "Disable Account"}
                </button>
              </div>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={isBusy}>
              {isBusy && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              {isCreate ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
