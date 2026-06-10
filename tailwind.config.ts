import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18211f",
        paper: "#f8f7f2",
        moss: "#517567",
        coral: "#c96f4a",
        clay: "#8d6b55",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 33, 31, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
