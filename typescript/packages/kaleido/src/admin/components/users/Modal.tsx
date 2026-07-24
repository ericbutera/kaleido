import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { handleFormError } from "../../../auth/lib/form";
import type { User, UserFormData } from "../../../users/useUsers";
import {
  useDisableUserAccount,
  useUpdateUser,
  useUser,
} from "../../../users/useUsers";

interface ModalProps {
  selectedUser: User | null;
  onClose: () => void;
}

const EMPTY_USER_FORM: UserFormData = {
  email: "",
  name: "",
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

export default function Modal({ selectedUser, onClose }: ModalProps) {
  const selectedUserId = getUserId(selectedUser);
  const detailQuery = useUser(selectedUserId);
  const detailUser = detailQuery.data ?? selectedUser;

  const updateUser = useUpdateUser();
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

  const isOpen = selectedUser !== null;

  useEffect(() => {
    if (!isOpen) return;

    reset({
      email: String(detailUser?.email ?? ""),
      name: String(detailUser?.name ?? ""),
      is_admin: !!detailUser?.is_admin,
    });
    setAccountDisabled(isUserDisabled(detailUser));
  }, [detailUser, isOpen, reset]);

  const pending = useMemo(
    () => updateUser.isPending || disableUserAccount.isPending,
    [disableUserAccount.isPending, updateUser.isPending],
  );

  const isBusy = pending || isSubmitting;

  if (!isOpen) return null;
  if (!selectedUserId) return null;

  const handleSave = async (data: UserFormData) => {
    try {
      await updateUser.mutateAsync({
        id: selectedUserId,
        data: {
          name: data.name || undefined,
          is_admin: data.is_admin,
        },
      });
      toast.success("User updated");

      onClose();
    } catch (err) {
      console.error("Failed to save user", err);
      handleFormError(err, setError, "Failed to save user");
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
          Edit User #{selectedUserId}
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
              readOnly
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

          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              {...register("is_admin")}
              disabled={isBusy}
            />
            <span className="label-text">Admin user</span>
          </label>

          <div className="rounded-lg border border-base-300 p-3 space-y-2">
            <div className="text-sm font-semibold">Account Status</div>
            <div className="flex flex-wrap gap-2">
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
