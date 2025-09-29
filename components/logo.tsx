import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  };

  return (
    <Link
      href="/admin/dashboard"
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <Image
        src="/images/nsb-logo.png"
        alt="NewState Branding Co."
        width={40}
        height={40}
        className={sizeClasses[size]}
      />
    </Link>
  );
}
