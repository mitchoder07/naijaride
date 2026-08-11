"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Avatar className={cn("size-9", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? "user"} /> : null}
      <AvatarFallback className="bg-primary/15 text-primary font-semibold">
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
