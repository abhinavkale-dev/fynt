import { BentoGrid } from '../bento-grid';
export function FeaturesSection() {
    return (<section id="features" className="relative min-h-screen bg-[#151515] py-10 sm:py-12 md:py-14 lg:py-16 xl:py-20 snap-start flex flex-col justify-center">
            
            <div className="relative z-10 w-[92%] md:w-[88%] lg:w-[90%] mx-auto flex flex-col items-center gap-4 mb-8 sm:mb-10 md:mb-12">
                <div className="flex h-8 items-center gap-2 rounded-[11px] border border-[#F04D26] bg-[#F04D26]/5 px-2.5 text-xs font-medium text-white/75 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.6)]">
                    <svg aria-hidden="true" width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <path d="M6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 6.48063 4.78279 7.0726 4.4277 7.4277C4.0726 7.78279 3.48063 8 2.5 8C2.22386 8 2 8.22386 2 8.5C2 8.77614 2.22386 9 2.5 9C3.48063 9 4.0726 9.21721 4.4277 9.5723C4.78279 9.9274 5 10.5194 5 11.5C5 11.7761 5.22386 12 5.5 12C5.77614 12 6 11.7761 6 11.5C6 10.5194 6.21721 9.9274 6.5723 9.5723C6.9274 9.21721 7.51937 9 8.5 9C8.77614 9 9 8.77614 9 8.5C9 8.22386 8.77614 8 8.5 8C7.51937 8 6.9274 7.78279 6.5723 7.4277C6.21721 7.0726 6 6.48063 6 5.5Z" fill="currentColor"></path>
                            <path d="M11 1.5C11 1.22386 10.7761 1 10.5 1C10.2239 1 10 1.22386 10 1.5C10 2.13341 9.85918 2.47538 9.66728 2.66728C9.47538 2.85918 9.13341 3 8.5 3C8.22386 3 8 3.22386 8 3.5C8 3.77614 8.22386 4 8.5 4C9.13341 4 9.47538 4.14082 9.66728 4.33272C9.85918 4.52462 10 4.86659 10 5.5C10 5.77614 10.2239 6 10.5 6C10.7761 6 11 5.77614 11 5.5C11 4.86659 11.1408 4.52462 11.3327 4.33272C11.5246 4.14082 11.8666 4 12.5 4C12.7761 4 13 3.77614 13 3.5C13 3.22386 12.7761 3 12.5 3C11.8666 3 11.5246 2.85918 11.3327 2.66728C11.1408 2.47538 11 2.13341 11 1.5Z" fill="currentColor"></path>
                            <path fillRule="evenodd" clipRule="evenodd" d="M20 15C15.1389 15 13 17.1389 13 22C13 17.1389 10.8611 15 6 15C10.8611 15 13 12.8611 13 8C13 12.8611 15.1389 15 20 15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path>
                        </g>
                    </svg>
                    <span>Features</span>
                </div>
                <h2 className="font-serif italic text-[#7D7D87] text-center font-normal text-xl md:text-2xl leading-tight">
                    Everything you need to build powerful workflows
                </h2>
            </div>

            
            <BentoGrid />
        </section>);
}
