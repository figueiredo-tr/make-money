import { supabase } from "./supabaseClient";

/**
 * Busca o perfil do usuário autenticado atualmente (role + contratante_id).
 * Retorna null se não houver perfil (usuário sem acesso configurado).
 */
export async function getPerfilAtual() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis")
    .select("id, role, contratante_id")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error.message);
    return null;
  }

  return data; // { id, role: 'admin' | 'contratante', contratante_id }
}

/**
 * Atalho: retorna true se o usuário logado é admin.
 */
export async function isAdminAtual() {
  const perfil = await getPerfilAtual();
  return perfil?.role === "admin";
}

/**
 * Lista todos os contratantes (só funciona pra admin, RLS bloqueia o resto).
 */
export async function listarContratantes() {
  const { data, error } = await supabase
    .from("contratantes")
    .select("id, nome, ativo, created_at")
    .order("nome");

  if (error) throw new Error(`Erro ao listar contratantes: ${error.message}`);
  return data;
}

/**
 * Cria um novo contratante + já retorna o id (admin usa isso ao "cadastrar cliente novo").
 * OBS: depois de criar aqui, ainda precisa criar o usuário no Supabase Auth manualmente
 * e inserir o registro em `perfis` linkando o novo user.id a esse contratante_id
 * (isso ainda não tem UI própria — ver STATUS.md).
 */
export async function criarContratante(nome) {
  const { data, error } = await supabase
    .from("contratantes")
    .insert({ nome })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar contratante: ${error.message}`);
  return data;
}
