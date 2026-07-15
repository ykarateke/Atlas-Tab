import { createContext, useContext, useEffect, useState } from "react";

export type FaviconResolver = (bookmarkUrl: string) => Promise<string | null>;

const FaviconContext = createContext<FaviconResolver | null>(null);

export const FaviconProvider = FaviconContext.Provider;

export function useFavicon(bookmarkUrl: string): string | null {
  const resolve = useContext(FaviconContext);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resolve) return;
    let cancelled = false;
    resolve(bookmarkUrl).then((result) => {
      if (!cancelled) setDataUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [bookmarkUrl, resolve]);

  return dataUrl;
}
