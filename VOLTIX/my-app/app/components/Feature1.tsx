import React from "react";
import ScrollStack, { ScrollStackItem } from "./ScrollStack";

const Feature1Section = () => {
  return (
    <section className="relative w-full py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Scroll Stack (sticky on large screens) */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-16">
              <ScrollStack
                useWindowScroll
                className=""
                itemDistance={140}
                itemScale={0.04}
                itemStackDistance={40}
                baseScale={1.0}
                rotationAmount={0}
              >
                <ScrollStackItem>
                  <div className="aspect-[4/3] w-full h-full overflow-hidden rounded-3xl shadow-2xl">
                    <img
                      src="/images/stack/stack-1.jpg"
                      alt="Zero-Wait Energy"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </ScrollStackItem>
                <ScrollStackItem>
                  <div className="aspect-[4/3] w-full h-full overflow-hidden rounded-3xl shadow-2xl">
                    <img
                      src="/images/stack/stack-2.jpg"
                      alt="Agentic Intelligence"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </ScrollStackItem>
                <ScrollStackItem>
                  <div className="aspect-[4/3] w-full h-full overflow-hidden rounded-3xl shadow-2xl">
                    <img
                      src="/images/stack/stack-3.png"
                      alt="Grid-Aware Reliability"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </ScrollStackItem>
              </ScrollStack>
            </div>
          </div>

          {/* Right: Text content aligned with the cards */}
          <div className="lg:col-span-5 lg:pl-6">
            <div className="space-y-24 pb-12 lg:pb-16 flex flex-col justify-center min-h-[80vh]">
              <div className="max-w-md">
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">
                  Zero-Wait Energy
                </h3>
                <p className="mt-3 mb-6 text-slate-600 text-lg leading-relaxed">
                  Forget waiting 45 minutes to charge. Swap your depleted
                  battery for a fully charged one in under{" "}
                  <span className="text-emerald-500 font-semibold">
                    180 seconds
                  </span>{" "}
                  and get back on the road instantly. Our automated pit-stop
                  mechanism ensures you never queue for power again—it's faster
                  than filling a gas tank.
                </p>
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">
                  Agentic Intelligence
                </h3>
                <p className="mt-3 mb-6 text-slate-600 text-lg leading-relaxed">
                  Our 5-Agent Neural Squad monitors every volt. From{" "}
                  <span className="text-emerald-500 font-semibold">
                    Self-Healing
                  </span>{" "}
                  broken chargers to{" "}
                  <span className="text-emerald-500 font-semibold">
                    Bribing
                  </span>{" "}
                  drivers to balance traffic, the system solves problems before
                  you see them. It is not just maintenance; it is an autonomous
                  immune system for your infrastructure.
                </p>
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">
                  Grid-Aware Reliability
                </h3>
                <p className="mt-3 mb-6 text-slate-600 text-lg leading-relaxed">
                  We don't just store power; we trade it. Our{" "}
                  <span className="text-emerald-500 font-semibold">
                    Energy Broker Agent
                  </span>{" "}
                  sells back to the grid during peak hours to lower costs and
                  ensure 99.9% uptime. Transform your station from a liability
                  into a dynamic financial asset that earns revenue while it
                  sleeps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature1Section;
