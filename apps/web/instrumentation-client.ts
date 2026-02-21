import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    disable_session_recording: true,
    loaded: (ph) => {
        window.addEventListener('load', () => ph.startSessionRecording(), { once: true });
    },
});
