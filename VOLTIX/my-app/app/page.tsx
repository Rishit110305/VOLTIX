// import HeroSection from "@/app/components/HeroSectio";
// import ClientsSection from "@/app/components/ClientSection";
// import Feature1Section from "@/app/components/Feature1";
// import Feature2Section from "@/app/components/Features2";
// import PricingSection from "@/app/components/PricingSection";
// import FooterSection from "@/app/components/FooterSection";
// import ChatBot from "@/app/components/ChatBot";
// import NeuralGrid from '@/components/NeuralGrid';
// // Make sure the import path matches your folder structure

// export default function Home() {
//   return (
//     <main className="min-h-screen w-full bg-background text-foreground">
//       {/* Render sections one after another so scroll-based effects can work across the page */}
//       <HeroSection />
//       <ClientsSection />
//       <Feature1Section />
//       <Feature2Section />
//       <PricingSection />
//       <FooterSection />
//       <ChatBot />
//       <NeuralGrid />
//     </main>
//   );
// }

import HeroSection from "@/app/components/HeroSectio"; // Note: keeping your original typo 'HeroSectio'
import ClientsSection from "@/app/components/ClientSection";
import Feature1Section from "@/app/components/Feature1";
import Feature2Section from "@/app/components/Features2";
import PricingSection from "@/app/components/PricingSection";
import FooterSection from "@/app/components/FooterSection";
import ChatBot from "@/app/components/ChatBot";



export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <HeroSection />
      <ClientsSection />
      <Feature1Section />
      <Feature2Section />



      <PricingSection />
      <FooterSection />
      <ChatBot />
    </main>
  );
}