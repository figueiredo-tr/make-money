"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Início",
    icon: (
      <path
        d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/clientes",
    label: "Associados",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" strokeWidth="1.6" />
        <path
          d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/parcelas",
    label: "Parcelas",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="1.5" strokeWidth="1.6" />
        <path
          d="M3.5 9.5h17M8 3v3.5M16 3v3.5"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/emprestimos/novo",
    label: "Novo",
    icon: <path d="M12 5v14M5 12h14" strokeWidth="1.8" strokeLinecap="round" />,
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: (
      <>
        <circle cx="12" cy="7.5" r="3.5" strokeWidth="1.6" />
        <path
          d="M4.5 20c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-bg-elevated border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                active ? "text-gold" : "text-faint"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="shrink-0"
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
