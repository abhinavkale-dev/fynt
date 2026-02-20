export const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;
export const pageHeader = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: EASE_OUT_QUAD },
};
export const staggerContainer = (stagger = 0.06, delay = 0.1) => ({
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
export const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: EASE_OUT_QUAD },
    },
};
export const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2, delay },
});
export const contentExpand = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" as const },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2, ease: "easeOut" as const },
};
export const popoverReveal = {
    initial: { opacity: 0, scale: 0.95, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -4 },
    transition: { duration: 0.15, ease: "easeOut" as const },
};
