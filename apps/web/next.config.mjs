/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@svar-ui/react-calendar',
    '@svar-ui/calendar-store',
    '@svar-ui/react-editor',
    '@svar-ui/lib-state'
  ],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
