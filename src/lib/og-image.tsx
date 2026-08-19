import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

export function buildOgImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0b1120",
          backgroundImage: "linear-gradient(135deg, #0b1120 0%, #111827 55%, #1e293b 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: "#1e293b",
              color: "#38bdf8",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {"{ }"}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#94a3b8", fontWeight: 600 }}>Objectparse</div>
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: "#f8fafc", lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#94a3b8", marginTop: 24, maxWidth: 900 }}>
          {subtitle}
        </div>
      </div>
    ),
    OG_IMAGE_SIZE
  );
}
