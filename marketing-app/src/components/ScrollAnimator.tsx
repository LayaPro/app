"use client";

import { useEffect } from "react";

/**
 * Global scroll animation observer.
 * Finds all elements with class "anim" and adds "in-view" when they enter the viewport.
 * This mirrors the working approach from laya-pro-dark.html.
 * Mount this ONCE in the layout — not per-component.
 */
export function ScrollAnimator() {
  useEffect(() => {
    // Small delay to ensure Next.js hydration is complete
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".anim");

      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
            }
          });
        },
        { threshold: 0.1, rootMargin: "50px" }
      );

      elements.forEach((el) => observer.observe(el));

      // Also handle dynamically added elements via MutationObserver
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains("anim")) {
                observer.observe(node);
              }
              node.querySelectorAll?.(".anim").forEach((child) => {
                observer.observe(child);
              });
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        mutationObserver.disconnect();
      };
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
