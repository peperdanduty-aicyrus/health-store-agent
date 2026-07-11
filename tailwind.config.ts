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
        ink: "#252B24",
        paper: "#EAF1E3",
        moss: "#5F6B4F",
        coral: "#c96f4a",
        clay: "#8d6b55",
        sage: "#A8B59F",
        olive: "#8E9678",
        khaki: "#D9C9A3",
        surface: "#F9FAF6",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(37, 43, 36, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
