import type { ReactNode } from "react";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
