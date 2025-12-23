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

  // Security headers to protect against common web vulnerabilities
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          {
            // Prevent clickjacking attacks by disallowing iframe embedding
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Prevent MIME type sniffing attacks
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Control referrer information sent with requests
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Enable browser XSS protection (legacy, but still useful)
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Restrict permissions/features the browser can use
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default config;
