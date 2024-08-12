import { entries } from "lodash";
import { useEffect } from "react";

export const useAnimateOnScroll = (
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

    const observer = new IntersectionObserver((entries, observer)=> {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const animationClass = element.dataset.animation || "animate__fadeInUp";
            const duration = element.dataset.duration || "0.5s";
            const delay = element.dataset.delay || "0s";

          element.classList.add("animate__animated", animationClass);
          element.style.setProperty("--animate-duration", duration);
          element.style.setProperty("--animate-delay", delay);

          observer.unobserve(element);
          }
        });
      },
      options  );

    const elements = document.querySelectorAll<HTMLElement>('[data-animation]');
    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);
};