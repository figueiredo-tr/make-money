"use client";

import { useEffect, useRef, useState } from "react";

export default function ClienteCombobox({
  clientes,
  value,
  onChange,
  placeholder = "Buscar associado…",
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  const selecionado = clientes.find((c) => c.id === value);

  useEffect(() => {
    if (selecionado) setTexto(selecionado.nome);
  }, [selecionado?.id]);

  useEffect(() => {
    function handleClickFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(texto.toLowerCase()),
  );

  function selecionar(cliente) {
    onChange(cliente.id);
    setTexto(cliente.nome);
    setAberto(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="input"
        placeholder={placeholder}
        value={texto}
        onFocus={() => setAberto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          if (value) onChange("");
        }}
      />

      {aberto && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-bg-elevated-2 border border-line rounded-sm shadow-lg">
          {filtrados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-faint">
              Nenhum associado encontrado.
            </p>
          ) : (
            filtrados.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => selecionar(c)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gold/10 ${
                  c.id === value ? "text-gold" : "text-ink"
                }`}
              >
                {c.nome}
                {c.telefone && (
                  <span className="text-faint ml-2 font-mono text-xs">
                    {c.telefone}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
