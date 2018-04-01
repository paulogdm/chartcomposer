module.exports = {
  publicRuntimeConfig: {
    // Will be available on both server and client
    DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY,
    DROPBOX_APP_SECRET: process.env.DROPBOX_APP_SECRET,
    DROPBOX_PUBLIC_TOKEN: process.env.DROPBOX_PUBLIC_TOKEN,
    IS_DEV: process.env.NODE_ENV === "development",
  },
};
