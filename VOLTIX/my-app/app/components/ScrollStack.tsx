"use client";

import React, { useLayoutEffect, useRef, useCallback } from "react";
import Lenis from "lenis";

export const ScrollStackItem: React.FC<{
  children: React.ReactNode;
  itemClassName?: string;
}> = ({ children, itemClassName = "" }) => (
  <div
    className={`scroll-stack-card relative w-full h-80 my-8 p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform ${itemClassName}`.trim()}
    style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
  >
    {children}
  </div>
);

type ScrollStackProps = {
  children: React.ReactNode;
  className?: string;
  itemDistance?: number; // px space between stacked items
  itemScale?: number; // scale increment between items
  itemStackDistance?: number; // px offset between items while pinned
  stackPosition?: string | number; // e.g. '20%'
  scaleEndPosition?: string | number; // e.g. '10%'
  baseScale?: number;
  scaleDuration?: number; // not used directly but kept for API compatibility
  rotationAmount?: number; // deg per depth
  blurAmount?: number; // px per depth
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
};

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastTransformsRef = useRef<Map<number, any>>(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === "string" && value.includes("%")) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(String(value));
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement,
      };
    } else {
      const scroller = scrollerRef.current as HTMLDivElement;
      return {
        scrollTop: scroller.scrollTop,
        containerHeight: scroller.clientHeight,
        scrollContainer: scroller,
      };
    }
  }, [useWindowScroll]);

  // Utilities to get stable element top positions not affected by CSS transforms (prevents jitter)
  const getDocumentTop = useCallback((el: HTMLElement) => {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  }, []);

  const getTopRelativeToScroller = useCallback(
    (el: HTMLElement, scroller: HTMLElement) => {
      // Prefer walking up until scroller; if not found, fallback to doc top diff
      let top = 0;
      let node: HTMLElement | null = el;
      while (node && node !== scroller) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      if (node === scroller) return top;
      // Fallback (different offset containing blocks): use document top delta
      return getDocumentTop(el) - getDocumentTop(scroller);
    },
    [getDocumentTop]
  );

  const getElementOffset = useCallback(
    (element: Element) => {
      if (useWindowScroll) {
        // Use layout-based position to avoid feedback from transforms
        return getDocumentTop(element as HTMLElement);
      } else {
        const scroller = scrollerRef.current as HTMLElement | null;
        if (!scroller) return 0;
        return getTopRelativeToScroller(element as HTMLElement, scroller);
      }
    },
    [useWindowScroll, getDocumentTop, getTopRelativeToScroller]
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

    const endElement = useWindowScroll
      ? (document.querySelector(".scroll-stack-end") as HTMLElement | null)
      : (scrollerRef.current?.querySelector(".scroll-stack-end") as HTMLElement | null);

    const endElementTop = endElement ? getElementOffset(endElement) : 0;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop = getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
      const pinEnd = endElementTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = getElementOffset(cardsRef.current[j]);
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }

        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs((lastTransform.translateY ?? 0) - newTransform.translateY) > 0.1 ||
        Math.abs((lastTransform.scale ?? 0) - newTransform.scale) > 0.001 ||
        Math.abs((lastTransform.rotation ?? 0) - newTransform.rotation) > 0.1 ||
        Math.abs((lastTransform.blur ?? 0) - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : "";

        (card as HTMLElement).style.transform = transform;
        (card as HTMLElement).style.filter = filter;

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset,
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
      });

      lenis.on("scroll", handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    } else {
      const scroller = scrollerRef.current as HTMLDivElement | null;
      if (!scroller) return;

      const lenis = new Lenis({
        // @ts-ignore - wrapper/content are accepted by Lenis in element mode
        wrapper: scroller,
        // @ts-ignore
        content: scroller.querySelector(".scroll-stack-inner") as HTMLElement,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075,
      });

      lenis.on("scroll", handleScroll);

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      useWindowScroll
        ? (document.querySelectorAll(".scroll-stack-card") as NodeListOf<HTMLElement>)
        : (scroller.querySelectorAll(".scroll-stack-card") as NodeListOf<HTMLElement>)
    );

    cardsRef.current = cards as unknown as HTMLElement[];
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        (card as HTMLElement).style.marginBottom = `${itemDistance}px`;
      }
      (card as HTMLElement).style.willChange = "transform, filter";
      (card as HTMLElement).style.transformOrigin = "top center";
      (card as HTMLElement).style.backfaceVisibility = "hidden";
      (card as HTMLElement).style.transform = "translateZ(0)";
      // @ts-ignore
      (card as HTMLElement).style.webkitTransform = "translateZ(0)";
      (card as HTMLElement).style.perspective = "1000px";
      // @ts-ignore
      (card as HTMLElement).style.webkitPerspective = "1000px";
      // Ensure proper stacking order so later cards appear above earlier ones
      (card as HTMLElement).style.zIndex = String(1000 + i);
    });

    setupLenis();

    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      stackCompletedRef.current = false;
      cardsRef.current = [] as unknown as HTMLElement[];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
  ]);

  // Container styles based on scroll mode
  const containerStyles: React.CSSProperties = useWindowScroll
    ? {
        // Global scroll mode - avoid transforms here (they break sticky and can cause jitter)
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }
    : {
        // Container scroll mode - original behavior
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        scrollBehavior: "smooth",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        willChange: "scroll-position",
      };

  const containerClassName = useWindowScroll
    ? `relative w-full ${className}`.trim()
    : `relative w-full h-full overflow-y-auto overflow-x-visible ${className}`.trim();

  return (
    <div className={containerClassName} ref={scrollerRef} style={containerStyles}>
      <div className="scroll-stack-inner pt-10 px-6 md:px-20 pb-[12.5rem] min-h-screen">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  );
};

export default ScrollStack;
