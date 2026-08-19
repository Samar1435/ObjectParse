import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { AuthInspectorTool } from "@/components/tools/auth-inspector/auth-inspector-tool";

export const metadata: Metadata = {
  title: "Auth Inspector",
  description: "Log into multiple apps in this tab, auto-capture each token when you land back here, and decode them.",
  robots: { index: false, follow: false },
};

export default function AuthInspectorPage() {
  return (
    <ToolShell
      currentSlug="auth-inspector"
      title="Auth Inspector"
      description="Log into multiple apps in this tab, auto-capture each token when you land back here, and decode them — entirely in your browser."
    >
      <AuthInspectorTool />
    </ToolShell>
  );
}
