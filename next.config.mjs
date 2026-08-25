/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/dev/polypredict" : "";
const apiUrl = isProd
  ? "https://pixxelu.com/dev/polypredict/backend/public"
  : "http://127.0.0.1:8000";

const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default nextConfig;