/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.eroum.co.kr' },
      { protocol: 'https', hostname: '**.eroumcare.com' },
      { protocol: 'https', hostname: '**.nhis.or.kr' }
    ]
  }
};

export default nextConfig;
