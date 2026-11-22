import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vert text-base font-extrabold text-white">
        SC
      </span>
      <span className="text-xl font-extrabold tracking-tight">Sunu Campus</span>
    </Link>
  );
}
