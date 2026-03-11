import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <ul className="menu p-2 w-full bg-base-100 text-base-content">
      <li>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "menu-active font-semibold" : undefined
          }
        >
          Overview
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/admin/tasks"
          className={({ isActive }) => (isActive ? "menu-active" : undefined)}
        >
          Tasks
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/admin/feature-flags"
          className={({ isActive }) => (isActive ? "menu-active" : undefined)}
        >
          Feature Flags
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => (isActive ? "menu-active" : undefined)}
        >
          Users
        </NavLink>
      </li>
    </ul>
  );
}
