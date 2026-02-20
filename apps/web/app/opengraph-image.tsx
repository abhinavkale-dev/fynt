import { ImageResponse } from "next/og";

export const alt = "Fynt | AI Workflow Automation";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 15% 20%, #2a2a2a 0%, #161616 36%, #090909 100%)",
          color: "#f5f5f5",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-90px",
            right: "-110px",
            width: "380px",
            height: "380px",
            borderRadius: "999px",
            background: "rgba(240, 77, 38, 0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-120px",
            width: "460px",
            height: "460px",
            borderRadius: "999px",
            background: "rgba(240, 77, 38, 0.12)",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#f04d26",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111111",
                fontWeight: 900,
                fontSize: "28px",
              }}
            >
              F
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "40px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              FYNT
            </div>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: "980px",
              fontSize: "78px",
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
            }}
          >
            Automate Workflows. Ship Faster.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: "920px",
              fontSize: "33px",
              lineHeight: 1.25,
              color: "#d1d1d1",
              marginBottom: "36px",
            }}
          >
            Connect your tools, add AI logic, and run reliable automations in
            minutes.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "fit-content",
              padding: "16px 24px",
              borderRadius: "999px",
              border: "2px solid rgba(240, 77, 38, 0.45)",
              background: "rgba(240, 77, 38, 0.16)",
              fontSize: "30px",
              fontWeight: 700,
              color: "#ffd7ce",
            }}
          >
            Start free at fynt.in
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "20px",
              fontSize: "20px",
              lineHeight: 1.2,
              color: "#b7b7b7",
            }}
          >
            <div style={{ display: "flex" }}>
              Design &amp; developed by @Abhinavstwt
            </div>
            <div style={{ display: "flex", fontSize: "17px", color: "#9f9f9f" }}>
              X: https://x.com/Abhinavstwt
            </div>
            <div style={{ display: "flex", fontSize: "17px", color: "#9f9f9f" }}>
              Github: https://github.com/abhinavkale-dev/fynt
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
