import { type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function AlertCard({
  icon,
  title,
  message,
  action,
}: {
  icon: IconDefinition | null;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card bg-base-100 shadow-soft hover:shadow-medium transition-shadow border border-base-300 w-full max-w-md mx-4">
        <div className="card-body p-8">
          <h2 className="card-title text-2xl mb-4">
            {icon && (
              <FontAwesomeIcon
                icon={icon}
                className="text-neutral-content-300 mb-4"
              />
            )}
            {title}
          </h2>

          <div className="mt-4 text-sm text-center">{message}</div>

          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}
