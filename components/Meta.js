import Head from "next/head";
export default () => (
  <div>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
    </Head>
    <style jsx global>{`
      body {
        font: 13px menlo, sans-serif;
        margin: 0;
      }
      textarea:focus,
      button:focus,
      li:focus {
        outline: 1px solid #666;
      }
    `}</style>
  </div>
);
