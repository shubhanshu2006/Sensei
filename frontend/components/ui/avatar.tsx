"use client";

import { cn, getInitials } from "@/lib/utils";
import { forwardRef, useState } from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
      fallback,
      firstName,
      lastName,
      size = "md",
      ...props
    },
    ref,
  ) => {
    const [imageError, setImageError] = useState(false);

    const initials = fallback || getInitials(firstName, lastName);

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-orange-500 text-white font-semibold overflow-hidden ring-2 ring-white shadow-sm",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar };
