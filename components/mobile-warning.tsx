"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const userAgentLower = userAgent.toLowerCase();

      // Check if it's a tablet (iPad or Android tablet)
      const isTablet =
        /ipad|android(?!.*mobile)|tablet/i.test(userAgentLower) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth >= 768);

      // If it's a tablet, don't show the warning
      if (isTablet) {
        setIsMobile(false);
        return;
      }

      // Check for phone-specific user agents (excluding tablets)
      const isPhone =
        /iphone|ipod|android.*mobile|webos|blackberry|iemobile|opera mini|mobile/i.test(
          userAgentLower,
        );

      // Check screen width (phone if less than 768px)
      const isSmallScreen = window.innerWidth < 768;

      // Check if touch device
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Consider it a phone if it matches phone user agent OR (is small screen AND touch device)
      setIsMobile(isPhone || (isSmallScreen && isTouchDevice));
    };

    checkMobile();

    // Re-check on resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 text-muted-foreground">
          <Smartphone className="h-16 w-16" />
          <div className="flex items-center">
            <span className="text-4xl">→</span>
          </div>
          <Monitor className="h-16 w-16 text-primary" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Phone Not Supported
          </h1>
          <p className="text-lg text-muted-foreground">
            This annotation tool requires a larger screen for the best
            experience.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4 text-left space-y-2">
          <p className="font-semibold text-foreground">Please use:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>A desktop or laptop computer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>A tablet (iPad, Android tablet)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                Or enable <strong className="text-foreground">Desktop Mode</strong> in your
                browser settings
              </span>
            </li>
          </ul>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p>
            <strong>Why?</strong> This tool requires precise video controls,
            multiple panels, and keyboard shortcuts that work best on larger
            screens.
          </p>
        </div>
      </div>
    </div>
  );
}
