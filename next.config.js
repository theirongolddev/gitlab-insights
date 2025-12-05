/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gitlab.visiostack.com",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default config;
