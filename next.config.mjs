/** @type {import('next').NextConfig} */
const imageBaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_IMGS_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const imageUrl = imageBaseUrl ? new URL(imageBaseUrl) : null;
const storagePath = imageUrl?.pathname.includes("/storage/v1/object/public/")
  ? `${imageUrl.pathname.replace(/\/+$/, "")}/**`
  : "/storage/v1/object/public/**";

const nextConfig = {
  allowedDevOrigins: ["*.eun1.devtunnels.ms"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    qualities: [75, 90, 100],
    remotePatterns: imageUrl
      ? [
          {
            protocol: imageUrl.protocol.slice(0, -1),
            hostname: imageUrl.hostname,
            port: imageUrl.port,
            pathname: storagePath,
          },
        ]
      : [],
  },
};

export default nextConfig;
