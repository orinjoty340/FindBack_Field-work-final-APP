import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and configures the root HTML for every page during
// server / static rendering. It runs in Node.js, so it has no DOM access.
//
// IMPORTANT: Expo Router hands the compiled CSS + JavaScript bundles to this
// component through `useServerDocumentContext()`. They MUST be rendered
// (`headNodes` in <head>, `bodyNodes` in <body>) or the web build ships as
// unstyled HTML with no JavaScript.
export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, headNodes, bodyAttributes, bodyNodes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes} className="bg-background">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="FindBack - report and find lost items." />
        <title>FindBack</title>

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
