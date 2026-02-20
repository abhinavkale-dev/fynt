"use client";
import { useState } from 'react';
export function F1Integrations() {
    const [isActive, setIsActive] = useState(false);
    const handleToggle = () => {
        setIsActive(prev => !prev);
    };
    return (<div className="relative bg-[#111111] rounded-[28px] sm:rounded-[32px] lg:rounded-[38px] xl:rounded-[46px] h-[500px] sm:h-[520px] md:h-[540px] lg:h-[620px] xl:h-[660px] overflow-hidden">
            
            <div className="absolute top-[44px] sm:top-[50px] md:top-[54px] lg:top-[62px] xl:top-[74px] left-1/2 -translate-x-1/2 w-full flex items-center justify-center">
                <div className="relative">
                    
                    <svg viewBox="0 0 241 223" fill="none" xmlns="http://www.w3.org/2000/svg" onPointerEnter={(e) => { if (e.pointerType === 'mouse')
        setIsActive(true); }} onPointerLeave={(e) => { if (e.pointerType === 'mouse')
        setIsActive(false); }} onClick={handleToggle} className="cursor-pointer w-[228px] h-[228px] sm:w-[228px] sm:h-[228px] md:w-[230px] md:h-[230px] lg:w-[252px] lg:h-[252px] xl:w-[280px] xl:h-[280px]">
                        <path transform="matrix(.86603 -.5 .86603 .5 3.122 152.423)" fill="#111" stroke="#fff" d="M.866 0h135.947v135.947H.866z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 74.557 85.86)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 37.658 107.161)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 74.557 128.463)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 170.234 85.86)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 133.338 107.161)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 170.234 128.463)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 121.459 58.033)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 84.563 79.332)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 121.459 100.634)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 121.459 114.312)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 84.563 135.614)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 121.459 156.914)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 121.459 .5)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 84.563 21.802)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 121.459 43.102)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 74.557 28.953)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 37.658 50.256)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 74.557 71.556)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 170.234 28.953)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 133.338 50.256)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 170.234 71.556)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 -.86603 .5 121.459 58.033)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 .5 0 1 84.563 79.332)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <path transform="matrix(.86603 -.5 0 1 121.459 100.634)" fill="#000" fillOpacity=".6" stroke="#fff" strokeDasharray="5 5" d="M0 0h42.602v42.602H0z"/>
                        <circle cx="7.504" cy="7.504" r="6.754" transform="matrix(.86603 -.5 .86603 .5 151.781 196.234)" fill="#000" stroke="#ff6200" strokeWidth="1.5" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <path transform="matrix(.86603 .5 -.86603 .5 170.469 200.143)" stroke="url(#grad-a)" strokeWidth="1.5" d="M0-.75h37.834" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <circle cx="7.504" cy="7.504" r="6.754" transform="matrix(.86603 -.5 .86603 .5 175.543 181.539)" fill="#000" stroke="#ff6200" strokeWidth="1.5" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <path transform="matrix(.86603 .5 -.86603 .5 194.225 185.447)" stroke="url(#grad-b)" strokeWidth="1.5" d="M0-.75h37.834" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <circle cx="7.504" cy="7.504" r="6.754" transform="matrix(.86603 .5 -.86603 .5 45.941 167.468)" fill="#000" stroke="#ff6200" strokeWidth="1.5" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <path transform="matrix(-.86603 .5 -.86603 -.5 39.168 178.255)" stroke="url(#grad-c)" strokeWidth="1.5" d="M0-.75h37.834" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <circle cx="7.504" cy="7.504" r="6.754" transform="matrix(.86603 .5 -.86603 .5 71.578 182.791)" fill="#000" stroke="#ff6200" strokeWidth="1.5" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <path transform="matrix(-.86603 .5 -.86603 -.5 64.81 193.577)" stroke="url(#grad-d)" strokeWidth="1.5" d="M0-.75h37.834" style={{
            filter: isActive ? 'drop-shadow(0 0 8px #ff6200)' : 'none',
            transition: 'filter 0.3s ease'
        }}/>
                        <defs>
                            <linearGradient id="grad-a" x1="0" y1=".5" x2="37.834" y2=".5" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ff6200"/>
                                <stop offset="1" stopColor="#993b00" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="grad-b" x1="0" y1=".5" x2="37.834" y2=".5" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ff6200"/>
                                <stop offset="1" stopColor="#993b00" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="grad-c" x1="0" y1=".5" x2="37.834" y2=".5" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ff6200"/>
                                <stop offset="1" stopColor="#993b00" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="grad-d" x1="0" y1=".5" x2="37.834" y2=".5" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ff6200"/>
                                <stop offset="1" stopColor="#993b00" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            
            <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 lg:px-7 xl:px-8 pb-5 sm:pb-6 lg:pb-7 xl:pb-8">
                <h3 className="text-xl sm:text-2xl lg:text-[30px] xl:text-[36px] leading-snug lg:leading-[34px] xl:leading-[40px] text-white font-normal mb-2 lg:mb-3">
                    Connect everything you already use
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-[#7D7D87] leading-[17px] sm:leading-[19px] lg:leading-[22px]">
                    Bring Slack, GitHub, databases, internal tools, and MCP servers into one workflow.
                </p>
            </div>
        </div>);
}
