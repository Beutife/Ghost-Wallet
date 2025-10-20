// src/components/ui/badge.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { badgeVariants, BadgeProps } from "@/lib/ui/badge-variants";

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };// src/components/ui/badge.tsx
