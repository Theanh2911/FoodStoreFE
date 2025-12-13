import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ["foodstoreyenha.s3.amazonaws.com", "52.64.167.233"],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '52.64.167.233',
                port: '8080',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'foodstoreyenha.s3.amazonaws.com',
                pathname: '/**',
            }
        ],
    },

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value:
                            "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
