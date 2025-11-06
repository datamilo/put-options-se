import { useEffect } from 'react';

const BASE_TITLE = 'Swedish Put Options';

/**
 * Custom hook to set the browser page title
 * Helps users identify tabs by page name
 * @param pageTitle - The page title to display in the browser tab
 */
export const usePageTitle = (pageTitle: string) => {
  useEffect(() => {
    const fullTitle = pageTitle ? `${pageTitle} - ${BASE_TITLE}` : BASE_TITLE;
    document.title = fullTitle;

    // Cleanup: reset to base title on unmount
    return () => {
      document.title = BASE_TITLE;
    };
  }, [pageTitle]);
};
