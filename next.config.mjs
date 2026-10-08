const isProduction = process.env.NODE_ENV === "production"

const securityHeaders = [
  // Clickjacking: no other site may put this one inside a frame
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS only in production: on localhost it would pin HTTPS for the dev host
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Overrides the global CSP on watch pages, so frame-ancestors is repeated
        source: "/watch/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://vsembed.ru https://theajack.github.io; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
