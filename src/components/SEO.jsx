import React from "react";

export default function SEO({ title, description, path, schema }) {
  const currentHost = typeof window !== "undefined" ? window.location.origin : "https://a1c.onrender.com";
  const canonicalUrl = `${currentHost}${path}`;
  const fullTitle = title ? `${title} | ConvertAll` : "ConvertAll — Free Online Document & Image Converter";
  
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </>
  );
}
