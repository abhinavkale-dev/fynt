"use client";
import { useState } from 'react';
import { Check } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { SectionSeparators } from '../hero/SectionSeparators';
import { FAQSection } from '../faq';
export function PricingSection() {
    const [period, setPeriod] = useState<'monthly' | 'annually'>('annually');
    const prices = {
        free: { monthly: 0, annually: 0 },
        pro: { monthly: 20, annually: 15 },
        startup: { monthly: 50, annually: 38 }
    };
    return (<>
      <section id="pricing" className="relative bg-[#151515] py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif italic text-balance text-2xl sm:text-3xl font-bold text-white md:text-4xl lg:text-5xl lg:tracking-tight">
              Pricing that scale with your business
            </h2>
            <p className="text-[#7D7D87] mx-auto mt-4 max-w-xl text-balance text-lg">
              Choose the perfect plan for your needs and start optimizing your workflow today
            </p>
            
            
            <div className="my-12">
              <div className="relative mx-auto grid w-fit grid-cols-2 rounded-full bg-[#1E1E1E] p-1">
                <div aria-hidden="true" className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#2A2A2A] border border-[#333333] shadow transition-transform duration-500 ease-in-out ${period === 'monthly' ? 'translate-x-0' : 'translate-x-full'}`}/>
                <button className={`relative z-10 h-8 w-20 sm:w-22 md:w-24 rounded-full text-sm transition-colors ${period === 'monthly' ? 'text-white font-medium' : 'text-[#7D7D87]'}`} onClick={() => setPeriod('monthly')}>
                  Monthly
                </button>
                <button className={`relative z-10 h-8 w-20 sm:w-22 md:w-24 rounded-full text-sm transition-colors ${period === 'annually' ? 'text-white font-medium' : 'text-[#7D7D87]'}`} onClick={() => setPeriod('annually')}>
                  Annually
                </button>
              </div>
              <div className="mt-3 text-center text-xs">
                <span className="text-[#F04D26] font-medium">Save 25%</span> <span className="text-[#7D7D87]">On Annual Billing</span>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-lg mx-auto border border-[#333333]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 items-start">
                
                <div className="p-8 flex flex-col h-full">
                  <div className="flex-1 space-y-6">
                    <div className="min-h-[60px]">
                      <div className="tracking-tight text-lg font-medium text-white">
                        Free
                      </div>
                      <div className="text-[#7D7D87] mt-1 text-balance text-sm">
                        For developers trying out Fynt for the first time
                      </div>
                    </div>
                    <div className="min-h-[72px]">
                      <div className="text-3xl font-semibold text-white leading-none" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
                        <span style={{ lineHeight: 1 }}>$</span>
                        <NumberFlow value={prices.free[period]} className="text-white" style={{ lineHeight: 1, fontSize: 30 }}/>
                      </div>
                      <div className="text-[#7D7D87] text-sm mt-2">Per month</div>
                    </div>
                    <a className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] text-[#E5E5E5] cursor-pointer" href="#">
                      Get Started
                    </a>
                    <ul role="list" className="space-y-3 text-sm">
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Up to 30 workflows
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        1,000 workflow runs per month
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Basic integrations
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Community support
                      </li>
                    </ul>
                  </div>
                </div>

                
                <div className="p-8 bg-[#1A1A1A] mx-1 rounded-lg ring-1 ring-[#333333] shadow-xl flex flex-col h-full">
                  <div className="flex-1 space-y-6">
                    <div className="min-h-[60px]">
                      <div className="tracking-tight text-lg font-medium text-white">
                        Pro
                      </div>
                      <div className="text-[#7D7D87] mt-1 text-balance text-sm">
                        Ideal for developers who need more features and support
                      </div>
                    </div>
                    <div className="min-h-[72px]">
                      <div className="text-3xl font-semibold text-white leading-none" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
                        <span style={{ lineHeight: 1 }}>$</span>
                        <NumberFlow value={prices.pro[period]} className="text-white" style={{ lineHeight: 1, fontSize: 30 }}/>
                      </div>
                      <div className="text-[#7D7D87] text-sm mt-2">Per month</div>
                    </div>
                    <a className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-[#F04D26] hover:bg-[#F04D26]/90 text-white shadow-md border-[0.5px] border-white/10 cursor-pointer" href="#">
                      Get Started
                    </a>
                    <ul role="list" className="space-y-3 text-sm">
                      <li className="font-medium text-[#E5E5E5]">
                        Everything in Free Plan, plus:
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Unlimited workflows
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        10,000 executions per month
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        All premium integrations
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        AI-powered nodes
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Custom templates
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Priority email support
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Execution history (30 days)
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Advanced analytics
                      </li>
                    </ul>
                  </div>
                </div>

                
                <div className="p-8 flex flex-col h-full">
                  <div className="flex-1 space-y-6">
                    <div className="min-h-[60px]">
                      <div className="tracking-tight text-lg font-medium text-white">
                        Startup
                      </div>
                      <div className="text-[#7D7D87] mt-1 text-balance text-sm">
                        For teams scaling their automation workflows
                      </div>
                    </div>
                    <div className="min-h-[72px]">
                      <div className="text-3xl font-semibold text-white leading-none" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
                        <span style={{ lineHeight: 1 }}>$</span>
                        <NumberFlow value={prices.startup[period]} className="text-white" style={{ lineHeight: 1, fontSize: 30 }}/>
                      </div>
                      <div className="text-[#7D7D87] text-sm mt-2">Per month</div>
                    </div>
                    <a className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] text-[#E5E5E5] cursor-pointer" href="#">
                      Get Started
                    </a>
                    <ul role="list" className="space-y-3 text-sm">
                      <li className="font-medium text-[#E5E5E5]">
                        Everything in Pro Plan, plus:
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        50,000 executions per month
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Team collaboration (up to 5 users)
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Custom webhooks
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Execution history (90 days)
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        API access
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Advanced error handling
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Priority support
                      </li>
                      <li className="flex items-center gap-2 text-[#E5E5E5]">
                        <Check className="text-[#7D7D87] size-3" strokeWidth={3.5}/>
                        Dedicated onboarding
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="hidden lg:block">
        <SectionSeparators />
      </div>
      
      <FAQSection />
    </>);
}
