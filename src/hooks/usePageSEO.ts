import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageSEOOptions {
  title: string;
  description: string;
}

function getOrCreate(tag: string, attr: string, value: string): Element {
  let el = document.querySelector(`${tag}[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(attr.split("=")[0].replace(/[\[\]"']/g, ""), value);
    document.head.appendChild(el);
  }
  return el;
}

export const usePageSEO = ({ title, description }: PageSEOOptions) => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;

    const canonicalUrl = `${window.location.origin}${pathname}`;

    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", description);

    // OG
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", canonicalUrl);

    // Twitter
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", title);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute("content", description);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [title, description, pathname]);
};
