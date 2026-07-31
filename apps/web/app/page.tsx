import Header from "@/components/landing-page/header";
import Hero from "@/components/landing-page/hero";
import { EditorialLines } from "@/components/landing-page/hero/EditorialLines";
import { SectionSeparators } from "@/components/landing-page/hero/SectionSeparators";
import { FeaturesSection } from "@/components/landing-page/hero/FeaturesSection";
import { DesktopPlayground } from "@/components/landing-page/playground/DesktopPlayground";
import { TemplatesSection } from "@/components/landing-page/templates";
import { PricingSection } from "@/components/landing-page/pricing";
import { FooterCTA } from "@/components/landing-page/footer-cta";
import { FooterCTASectionSeparator } from "@/components/landing-page/footer-cta/FooterCTASectionSeparator";
import { Footer } from "@/components/landing-page/footer-cta/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

async function getStarsCount(): Promise<string | null> {
  try {
    const data = await fetch(
      "https://api.github.com/repos/abhinavkale-dev/fynt",
      {
        next: { revalidate: 86400 },
      },
    );
    const json = await data.json();
    const count = json.stargazers_count;
    if (count == null) return null;
    if (count >= 1000) {
      return count % 1000 === 0
        ? `${Math.floor(count / 1000)}k`
        : `${(count / 1000).toFixed(1)}k`.replace(".0k", "k");
    }
    return count.toLocaleString();
  } catch {
    return null;
  }
}

export default async function Home() {
  const stars = await getStarsCount();
  return (
    <main className="h-screen bg-[#151515]">
      <ScrollArea type="scroll" scrollHideDelay={500} className="h-full w-full">
        <EditorialLines />
        <Header />
        <Hero stars={stars} />

        <div className="w-[90%] sm:w-[88%] md:w-[85%] lg:w-[80%] xl:w-[80%] mx-auto md:px-4 lg:px-6 xl:px-8 max-w-[1400px] 2xl:max-w-[1560px] min-[120rem]:max-w-[1700px]">
          <SectionSeparators />

          <div className="snap-y snap-mandatory">
            <FeaturesSection />

            <DesktopPlayground />

            <TemplatesSection />
          </div>

          <div className="md:hidden">
            <SectionSeparators />
          </div>

          <PricingSection />

          <FooterCTA />
        </div>

        <FooterCTASectionSeparator />

        <div className="w-[90%] sm:w-[88%] md:w-[85%] lg:w-[80%] xl:w-[80%] mx-auto md:px-4 lg:px-6 xl:px-8 max-w-[1400px] 2xl:max-w-[1560px] min-[120rem]:max-w-[1700px]">
          <Footer />
        </div>
      </ScrollArea>
    </main>
  );
}
