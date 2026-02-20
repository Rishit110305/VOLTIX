/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 2s linear infinite",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-reverse": "marquee-reverse var(--duration) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "marquee-vertical-reverse":
          "marquee-vertical-reverse var(--duration) linear infinite",
      },
      keyframes: {
        shimmer: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-reverse": {
          from: { transform: "translateX(calc(-100% - var(--gap)))" },
          to: { transform: "translateX(0)" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical-reverse": {
          from: { transform: "translateY(calc(-100% - var(--gap)))" },
          to: { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
