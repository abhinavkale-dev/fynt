"use client";
import React from 'react';
interface SideLineProps {
    side: 'left' | 'right';
}
export function SideLine({ side }: SideLineProps) {
    const isLeft = side === 'left';
    return (<div className="relative hidden h-px flex-1 border-t border-solid border-white/20 lg:block">
      
      <div className={`absolute z-30 -top-1 ${isLeft ? '-right-px' : '-left-px'}`}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
        </svg>
      </div>
    </div>);
}
