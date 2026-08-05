"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Libretto" },
  { href: "/clientes", label: "Associados" },
  { href: "/parcelas", label: "Parcelas" },
  { href: "/emprestimos/novo", label: "Novo Empréstimo" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-bg-elevated border-r border-line flex-col relative">
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-dim/40 to-transparent" />

      <div className="px-6 py-7 border-b border-line">
        <p className="eyebrow">Sistema Interno</p>
        <h1 className="font-display italic text-xl text-ink mt-1">Libretto</h1>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2.5 text-sm rounded-sm transition-colors ${
                active
                  ? "bg-gold/10 text-gold border-l-2 border-gold pl-[10px]"
                  : "text-muted hover:text-ink hover:bg-white/[0.02] border-l-2 border-transparent pl-[10px]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-5 border-t border-line">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 text-sm text-faint hover:text-muted transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
