import { Shrink } from "lucide-react";
import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Shrink">
      <span>
        <Shrink size={19} strokeWidth={2.6} />
      </span>
      Shrink<span className="brand-dot">.</span>
    </Link>
  );
}
