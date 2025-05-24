/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        os: false,
        path: false,
        stream: false,
        crypto: false,
      };
    }

    // Exclude nodemailer and its dependencies from client-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        nodemailer: false,
        'nodemailer/lib/sendmail-transport': false,
        'nodemailer/lib/smtp-transport': false,
        'nodemailer/lib/stream-transport': false,
        'nodemailer/lib/json-transport': false,
        'nodemailer/lib/well-known': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig; 