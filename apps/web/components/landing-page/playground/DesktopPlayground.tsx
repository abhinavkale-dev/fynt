'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SectionSeparators } from '../hero/SectionSeparators';

const PlaygroundSection = dynamic(
    () => import('./PlaygroundSection').then(m => ({ default: m.PlaygroundSection })),
    { ssr: false }
);

export function DesktopPlayground() {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    if (!isDesktop) return null;

    return (
        <>
            <SectionSeparators />
            <PlaygroundSection />
        </>
    );
}
