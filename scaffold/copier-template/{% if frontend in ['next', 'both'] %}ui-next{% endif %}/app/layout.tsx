import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "[[ project_slug ]]",
  description: "Next.js frontend scaffold",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
