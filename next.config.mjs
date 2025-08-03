/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker
    output: 'standalone',

    // Ignore TypeScript errors during build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Ignore ESLint errors during build
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://kanban-api.ngtantai.pro',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://kanban.ngtantai.pro',
    },

    // Headers for security and favicon
    async headers() {
        return [{
            source: '/(.*)',
            headers: [{
                    key: 'X-Frame-Options',
                    value: 'DENY',
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block',
                },
                {
                    key: 'Referrer-Policy',
                    value: 'strict-origin-when-cross-origin',
                },
            ],
        }, {
            source: '/favicon.ico',
            headers: [{
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
            }],
        }, {
            source: '/apple-touch-icon.png',
            headers: [{
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
            }],
        }, {
            source: '/android-chrome-:size.png',
            headers: [{
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
            }],
        }]
    },

    // Redirects
    async redirects() {
        return [{
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
            permanent: true,
        }, ]
    },

    // Images configuration
    images: {
        domains: ['kanban-api.ngtantai.pro', 'kanban.ngtantai.pro'],
        formats: ['image/webp', 'image/avif'],
    },

    // Webpack configuration
    webpack: (config, {
        isServer
    }) => {
        // Optimize bundle size
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            }
        }

        return config
    },
}

export default nextConfig