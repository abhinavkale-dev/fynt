import { HeroAnimation } from './HeroAnimation';
import ShinyText from '@/components/ui/ShinyText';
export function HeroContent({ stars }: { stars?: string | null }) {
    return (<div className="relative z-10 mx-auto w-full sm:w-[88%] md:w-[85%] lg:w-[80%] xl:w-[80%] max-w-[1920px] overflow-x-hidden overflow-y-visible min-[120rem]:overflow-visible px-4 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 min-[97.5rem]:px-12">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-7 md:gap-8 lg:gap-10 xl:gap-12 2xl:gap-16 min-[97.5rem]:gap-20 items-start md:min-h-[560px] lg:min-h-[660px] xl:min-h-[760px] min-[120rem]:min-h-[860px]">
                <div className="md:pl-2 lg:pl-7 xl:pl-3 2xl:pl-13 min-[97.5rem]:pl-15 min-[120rem]:pl-17 lg:pr-6 xl:pr-8">
                    
                    <div className="text-center md:text-left mt-0 sm:mt-2 md:mt-0 lg:mt-7 xl:mt-8 2xl:mt-9">
                        <h1 className="font-serif text-2xl sm:text-2xl md:text-[26px] lg:text-[40px] xl:text-[45px] min-[97.5rem]:text-[50px] leading-tight lg:leading-[1.08] tracking-tight text-white mb-6 md:mb-8">
                            <span className="block 2xl:whitespace-nowrap">Your workflows aren&apos;t linear.</span>
                            <span className="block 2xl:whitespace-nowrap">Your engine shouldn&apos;t be either.</span>
                        </h1>

                        <p className="max-w-xl 2xl:max-w-2xl mx-auto md:mx-0 text-sm lg:text-[17px] xl:text-[14px] 2xl:text-[18px] min-[97.5rem]:text-[18px] text-[#A1A1AA] mb-10 md:mb-10 leading-relaxed font-sans">
                            A graph-based workflow engine with node-level retries, checkpointing, and crash-safe execution built for production systems.
                        </p>
                    </div>

                    
                    <div className="relative mx-auto md:hidden w-full max-w-[420px] h-[220px] sm:h-[250px] mb-12 sm:mb-10 overflow-visible">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.42] sm:scale-[0.4]">
                            <HeroAnimation />
                        </div>
                    </div>

                    
                    <div className="relative mx-auto flex w-fit max-w-full flex-row flex-nowrap items-center justify-center gap-2 sm:gap-3 md:mx-0 md:w-full md:justify-start md:gap-4 mt-25 mb-6 sm:mb-4 md:mb-0 md:mt-8 lg:mt-0">
                        <a href="/home" className="group shrink-0 flex items-center gap-0.5 whitespace-nowrap bg-[#F04D26] hover:bg-[#F04D26]/90 text-white rounded-[11px] md:rounded-[12px] pl-3 pr-2.5 md:pl-4 md:pr-3.5 min-[97.5rem]:pl-5 min-[97.5rem]:pr-4 h-9 md:h-10 lg:h-10 xl:h-10 2xl:h-11 min-[97.5rem]:h-12 text-xs md:text-sm lg:text-sm xl:text-sm 2xl:text-base min-[97.5rem]:text-base font-medium shadow-sm transition-[background-color,transform] duration-150 ease focus:outline-none active:scale-[0.97] motion-reduce:transition-none">
                            Get Started
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="size-4 md:size-[17px] lg:size-[17px] 2xl:size-[18px] transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none">
                                <path stroke="currentColor" strokeLinecap="square" strokeWidth="1.25" d="M8.333 13.333 11.667 10 8.333 6.667"></path>
                            </svg>
                        </a>
                        <div className="relative shrink-0">
                            <a href="https://github.com/abhinavkale-dev/fynt" target="_blank" rel="noopener noreferrer" className="shrink-0 bg-white/10 hover:bg-white/20 whitespace-nowrap text-white rounded-[11px] md:rounded-[12px] px-3 md:px-4 min-[97.5rem]:px-5 h-9 md:h-10 lg:h-10 xl:h-10 2xl:h-11 min-[97.5rem]:h-12 text-xs md:text-sm lg:text-sm xl:text-sm 2xl:text-base min-[97.5rem]:text-base font-medium shadow-sm transition-[background-color,transform] duration-150 ease flex items-center gap-1.5 md:gap-2 active:scale-[0.97] motion-reduce:transition-none">
                                <span>Star Github</span>
                                <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[17px] h-[17px] md:w-[17px] md:h-[17px] 2xl:w-[18px] 2xl:h-[18px]">
                                    <path d="M16 2.34475C23.735 2.34475 30 8.60975 30 16.3447C29.998 22.3597 26.161 27.7038 20.463 29.6268C19.763 29.7668 19.5 29.3288 19.5 28.9618C19.5 28.4888 19.518 26.9837 19.518 25.1117C19.518 23.7997 19.081 22.9597 18.573 22.5217C21.688 22.1717 24.961 20.9818 24.961 15.6097C24.961 14.0697 24.418 12.8267 23.526 11.8477C23.666 11.4977 24.156 10.0627 23.386 8.13775C23.386 8.13775 22.213 7.75275 19.536 9.57275C18.416 9.25775 17.226 9.10075 16.036 9.10075C14.846 9.10075 13.656 9.25775 12.536 9.57275C9.859 7.77075 8.686 8.13775 8.686 8.13775C7.916 10.0627 8.406 11.4977 8.546 11.8477C7.654 12.8277 7.111 14.0877 7.111 15.6097C7.111 20.9648 10.366 22.1728 13.481 22.5228C13.078 22.8728 12.711 23.4858 12.588 24.3948C11.783 24.7628 9.77 25.3577 8.511 23.2397C8.248 22.8197 7.461 21.7878 6.359 21.8048C5.186 21.8228 5.887 22.4698 6.376 22.7318C6.971 23.0638 7.653 24.3067 7.811 24.7097C8.091 25.4967 9.001 27.0028 12.518 26.3547C12.518 27.5278 12.536 28.6297 12.536 28.9618C12.536 29.3298 12.273 29.7488 11.573 29.6268C5.854 27.7228 1.997 22.3717 2 16.3438C2 8.60875 8.265 2.34475 16 2.34475Z" fill="#F7F7F7"/>
                                </svg>
                            </a>
                            {stars && (
                                <>
                                    <svg className="text-white/20 pointer-events-none absolute top-2 left-[105%] w-10 h-10 rotate-195" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 323.057 323.057" xmlSpace="preserve" fill="currentColor">
                                        <path d="M281.442 256.312c-47.124 59.364-139.536 44.676-160.956-29.376-1.224-3.672-1.836-7.956-2.448-11.628 49.572-11.016 97.92-47.124 102.204-90.576 3.672-39.168-36.108-50.796-62.424-28.764-31.212 26.316-53.244 64.872-55.08 105.875-31.824 4.284-63.036-4.284-80.172-35.496-28.764-52.631 9.792-123.624 61.2-144.432 5.508-1.836 3.06-10.404-2.448-8.568C10.326 33.544-26.394 132.688 21.954 191.439c18.972 22.645 49.572 29.988 81.396 26.316 4.284 41.616 36.72 74.664 75.275 87.516 44.676 14.688 85.68-6.731 111.996-41.616 4.285-5.508-4.896-12.239-9.179-7.343M144.354 132.688c9.792-13.464 22.644-28.764 39.168-34.272 15.911-5.508 21.42 16.524 22.031 26.316.612 12.24-7.956 23.256-15.912 31.824-16.523 18.971-44.063 35.496-72.215 42.839 1.836-23.868 13.464-47.123 26.928-66.707" />
                                        <path d="M315.713 233.668c-17.136 0-34.884 1.224-51.408 5.508-6.731 1.836-3.672 11.016 3.061 9.792 13.464-2.448 27.54-1.836 41.004-1.224-.612 7.955-1.224 16.523-2.448 24.479-1.224 6.12-5.508 15.3-1.836 21.42 1.836 3.061 4.896 3.061 7.956 1.836 7.344-3.06 7.344-15.912 8.568-22.644 1.836-11.017 2.447-21.42 2.447-32.437 0-3.67-3.672-6.73-7.344-6.73" />
                                    </svg>
                                    <span className="font-mono pointer-events-none absolute top-12 left-[112%] -rotate-14 text-[10px] leading-tight whitespace-nowrap">
                                        <ShinyText text={`${stars} Stars`} speed={2} delay={1.8} color="#555555" shineColor="#FF6B45" spread={135} /> <br /> <span className="text-white/20">on Github</span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                
                <div className="relative hidden md:block perspective-[2000px] -mt-4 md:-mt-4 lg:-mt-6.5 md:ml-0 xl:ml-14 min-[97.5rem]:ml-0 z-10">
                    <HeroAnimation className="scale-[0.36] md:scale-[0.36] lg:scale-[0.4] xl:scale-[0.7] min-[97.5rem]:scale-[0.71] origin-top-left"/>
                </div>
            </div>
        </div>);
}
