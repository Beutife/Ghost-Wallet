// // import type { NextConfig } from "next";

// // const nextConfig: NextConfig = {
// //   eslint: {
// //     //  Disable Next.js built-in ESLint during build
// //     ignoreDuringBuilds: true,
// //   },
// //   typescript: {
// //     // Keep TypeScript checking enabled
// //     ignoreBuildErrors: false,
// //   },
// // };

// // export default nextConfig;

// // next.config.ts
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   webpack(config, _context) {
//     config.resolve = config.resolve || {};
//     config.resolve.alias = config.resolve.alias || {
//       '@metamask/sdk': false,
//     };

//     // Alias for async-storage shim
//     config.resolve.alias["@react-native-async-storage/async-storage"] =
//       "./src/shims/async-storage.js";

//     return config;
//   },
// };

// export default nextConfig;
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true, // Keep disabled until ESLint is stable
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@metamask/sdk": false,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;