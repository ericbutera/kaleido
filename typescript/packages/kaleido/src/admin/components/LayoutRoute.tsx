import { Outlet } from "react-router-dom";
import Layout from "./Layout";

export default function LayoutRoute({ title }: { title?: string }) {
  return (
    <Layout title={title}>
      <Outlet />
    </Layout>
  );
}
