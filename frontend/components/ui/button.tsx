import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md",
        primary:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md focus-visible:ring-emerald-500",
        secondary:
          "bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md focus-visible:ring-orange-500",
        outline:
          "border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 hover:border-slate-400",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md focus-visible:ring-rose-500",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        warning: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm",
        link: "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
