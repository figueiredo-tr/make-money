import { supabase } from "./supabaseClient";

export async function listarAnotacoes(clienteId) {
  const { data, error } = await supabase
    .from("anotacoes")
    .select("id, texto, created_at, created_by")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao carregar anotações: ${error.message}`);
  return data || [];
}

export async function criarAnotacao(clienteId, texto) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("anotacoes")
    .insert({ cliente_id: clienteId, texto, created_by: user?.id })
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar anotação: ${error.message}`);
  return data;
}

export async function excluirAnotacao(id) {
  const { error } = await supabase.from("anotacoes").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir anotação: ${error.message}`);
}
