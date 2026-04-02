import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DarkLogo from "@/images/DarkLogo.png";
import LightLogo from "@/images/LightLogo.png";

export function Logo({
  className,
  size = 28,
  showText = true,
}: {
  className?: string;
  size?: number;
  showText?: boolean;
}) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2", className)}>
      {/* Light mode: dark logo on light bg */}
      <Image
        src={LightLogo}
        alt="Geyed"
        className="dark:hidden"
        height={size}
        style={{ height: size, width: "auto" }}
        priority
      />
      {/* Dark mode: light logo on dark bg */}
      <Image
        src={DarkLogo}
        alt="Geyed"
        className="hidden dark:block"
        height={size}
        style={{ height: size, width: "auto" }}
        priority
      />
      {showText && (
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Geyed
        </span>
      )}
    </Link>
  );
}
