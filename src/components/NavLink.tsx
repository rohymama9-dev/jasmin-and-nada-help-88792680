import { Link } from "@tanstack/react-router";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        {...props}
        className={cn(className)}
        activeProps={{ className: cn(activeClassName) }}
        // Pending styling not supported same way; keep API surface
        {...(pendingClassName ? {} : {})}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
