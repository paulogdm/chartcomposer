import Head from "next/head";
export default () => (
  <div>
    <Head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, user-scalable=no"
      />
      <meta charSet="utf-8" />
      <link rel="stylesheet" href="/static/bootstrap.min.css" />
      <link rel="manifest" href="/manifest.json" />
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
