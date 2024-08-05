import { useEffect } from "react";

export const useAnimateOnScroll = (
  selector: string,
  animationClass: string,
  root: Element | null = null,
  rootMargin: string = "0px",
  threshold: number = 0.9
) => {
  useEffect(() => {
    const options = {
      root: root,
      rootMargin: rootMargin,
      threshold: threshold,
    };

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate__animated", animationClass);
            observer.unobserve(entry.target); // Stop observing after animation
          }
        });
      },
      options
    );

    const elements = document.querySelectorAll<HTMLElement>(selector);
    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [selector, animationClass, root, rootMargin, threshold]);
};