'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
const Workflows = () => {
    const router = useRouter();
    useEffect(() => {
        router.replace(`/home`);
    }, [router]);
    return null;
};
export default Workflows;
