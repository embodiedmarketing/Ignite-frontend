import { useEffect } from "react";

export function usePageLeaveWarning(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Please don't leave this page, this could take a few minutes.";
      return event.returnValue;
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      let linkElement: HTMLElement | null = null;
      let current: HTMLElement | null = target;

      while (current && current !== document.body) {
        if (current.tagName === "A" && current.getAttribute("href")) {
          linkElement = current;
          break;
        }
        if (
          current.getAttribute("href") &&
          current.getAttribute("href")?.startsWith("/")
        ) {
          linkElement = current;
          break;
        }
        current = current.parentElement;
      }

      if (!linkElement) return;

      const href = linkElement.getAttribute("href");

      if (!href) return;

      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const currentPath = window.location.pathname;
      if (href === currentPath || href === currentPath + "/") {
        return;
      }

      const shouldLeave = window.confirm(
        "Generation is in progress. Are you sure you want to leave this page? This could take a few minutes."
      );

      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isActive]);
}
