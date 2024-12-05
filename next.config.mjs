/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{
        hostname: 'superlend-assets.s3.ap-south-1.amazonaws.com',
    }],
  },
  reactStrictMode: false,
};

export default nextConfig;
