import Head from "next/head";

import { APP_NAME } from "../utils/constants";

export default () => (
  <div>
    <Head>
      <title>{APP_NAME}</title>
      <meta charSet="utf-8" />
      <meta
        name="Description"
        content={`${APP_NAME} lets you create and share sheet music with your friends.`}
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, user-scalable=no"
      />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#eeeeee" />
      <link rel="stylesheet" href="/static/bootstrap.min.css" />
    </Head>
    <style jsx global>{`
      body {
        font: 13px menlo, sans-serif;
        margin: 0;
      }
      @media print {
        @page {
          margin: 0;
        }
        body {
          padding: 2em;
        }
      }
    `}</style>
  </div>
);
