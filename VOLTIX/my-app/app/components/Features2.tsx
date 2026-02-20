"use client";

import React from "react";
import BentroGrid from "@/componentsAcertinity/ui/BentroGrid";

const Features2: React.FC = () => {
  return (
    <section className="relative w-full py-10 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Heading + subtext */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            What We Offer To The World!
          </h2>
          <p className="mt-6 text-base md:text-lg leading-7 text-emerald-600">
            Startup Framework gives you complete freedom over your creative process —
            you don’t have to think about any technical aspects. There are no
            limits and absolutely no coding.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-12 md:mt-16 flex justify-center">
          <BentroGrid
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt
            enableMagnetism
            clickEffect
            glowColor="16, 185, 129"
          />
        </div>
      </div>
    </section>
  );
};

export default Features2;
