// next.config.js
module.exports = {
  images: {
    domains: ["res.cloudinary.com", "img.classistatic.de"], // Add your Cloudinary domain
    // Optional: Configure device sizes and image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      {
        source: "/(.*)",
        has: [
          {
            type: "host",
            value: "www.autogaleriejülich.de",
          },
        ],
        destination: "https://autogaleriejülich.de/:1",
        permanent: true,
      },
    ];
  },
};
