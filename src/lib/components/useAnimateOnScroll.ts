import { useEffect } from "react";

export const useAnimateOnScroll = (
  selector: string,
  animationClass: string,
  duration: string = "1.5s", 
  root: Element | null = null,
  rootMargin: string = "0px",
  threshold: number = 0.2
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
            const element = entry.target as HTMLElement;
            element.classList.add("animate__animated", animationClass);
            element.style.setProperty("--animate-duration", duration);
            observer.unobserve(element);
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
  }, [selector, animationClass, duration, root, rootMargin, threshold]);
};