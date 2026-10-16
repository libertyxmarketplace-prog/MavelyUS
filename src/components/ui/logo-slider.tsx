"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* =============================================================================
   LogoSlider Component
   
   A smooth, infinite marquee/slider component for displaying logos.
   Uses Tailwind CSS where possible, raw CSS only for animations/masks.
============================================================================= */

export interface LogoItem {
  src: string;
  alt?: string;
}

export interface LogoSliderProps {
    /** Array of React nodes or { src, alt } logo objects */
    logos: (React.ReactNode | LogoItem)[];
    /** Animation speed - higher = slower (default: 45) */
    speed?: number;
    /** Scroll direction. Default: "left" */
    direction?: "left" | "right";
    /** Whether to show blur overlays on edges. Default: true */
    showBlur?: boolean;
    /** Number of blur layers for progressive effect. Default: 8 */
    blurLayers?: number;
    /** Blur intensity multiplier. Default: 1 */
    blurIntensity?: number;
    /** Additional CSS classes */
    className?: string;
    /** Whether to pause animation on hover. Default: false */
    pauseOnHover?: boolean;
}

export const LogoSlider = ({
    logos,
    speed = 45,
    direction = "left",
    showBlur = true,
    blurLayers = 8,
    blurIntensity = 1,
    className,
    pauseOnHover = true,
}: LogoSliderProps) => {
    // Duplicate for seamless infinite marquee loop
    const duplicated = [...logos, ...logos];

    const renderLogo = (item: React.ReactNode | LogoItem, idx: number) => {
      if (item && typeof item === "object" && "src" in item) {
        return (
          <img
            key={idx}
            src={(item as LogoItem).src}
            alt={(item as LogoItem).alt || "Partner"}
            className="h-8 max-w-[140px] object-contain opacity-60 hover:opacity-100 transition-opacity"
          />
        );
      }
      return <React.Fragment key={idx}>{item as React.ReactNode}</React.Fragment>;
    };

    return (
        <div
            className={cn(
                "logo-slider relative w-full overflow-hidden py-4",
                className
            )}
            style={
                {
                    "--speed": `${speed}s`,
                    "--count": duplicated.length,
                    "--blurs": blurLayers,
                    "--blur": blurIntensity,
                } as React.CSSProperties
            }
        >
            <div
                className={cn(
                    "logo-slider__container",
                    "relative w-full flex items-center overflow-hidden"
                )}
                data-direction={direction}
                data-pause-on-hover={pauseOnHover}
            >
                {/* Progressive Blur Overlay - Left */}
                {showBlur && (
                    <div className="absolute top-0 bottom-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-[#070707] to-transparent" />
                )}

                {/* Progressive Blur Overlay - Right */}
                {showBlur && (
                    <div className="absolute top-0 bottom-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-[#070707] to-transparent" />
                )}

                {/* Logo Track - Infinite marquee */}
                <div className="logo-slider__track flex items-center gap-10 whitespace-nowrap will-change-transform">
                    {duplicated.map((logo, index) => (
                        <div
                            key={index}
                            className="logo-slider__item flex items-center justify-center shrink-0"
                        >
                            {renderLogo(logo, index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

LogoSlider.displayName = "LogoSlider";

export default LogoSlider;
