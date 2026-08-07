"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPerfilAtual, listarContratantes } from "@/lib/perfil";
import Card from "@/components/ui/Card";

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(null); // null = checando, true/false depois
  const [contratantes, setContratantes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function checarEBuscar() {
      const perfil = await getPerfilAtual();

      if (!perfil || perfil.role !== "admin") {
        setAutorizado(false);
        router.replace("/dashboard");
        return;
      }

      setAutorizado(true);
      const lista = await listarContratantes();
      setContratantes(lista);
      setCarregando(false);
    }
    checarEBuscar();
  }, [router]);

  if (autorizado === null || carregando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="eyebrow">Carregando…</p>
      </main>
    );
  }

  if (!autorizado) return null;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow mb-1">Área administrativa</p>
        <h1 className="font-display italic text-3xl text-ink">Contratantes</h1>
      </header>

      <Card>
        {contratantes.length === 0 ? (
          <p className="text-sm text-faint py-4">
            Nenhum contratante cadastrado ainda.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contratantes.map((c) => (
                  <tr key={c.id}>
                    <td className="text-ink">{c.nome}</td>
                    <td className="text-muted">
                      {c.ativo ? "Ativo" : "Inativo"}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/${c.id}`}
                        className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                      >
                        Ver associados →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
