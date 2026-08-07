import { supabase } from "./supabaseClient";

/**
 * Busca o perfil do usuário autenticado atualmente (role + contratante_id + nome + email).
 * Retorna null se não houver perfil (usuário sem acesso configurado).
 */
export async function getPerfilAtual() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis")
    .select("id, role, contratante_id, nome")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error.message);
    return null;
  }

  return {
    ...data,
    email: user.email,
    // se o usuário ainda não definiu um nome, cai no e-mail como exibição
    nomeExibicao: data.nome || user.email,
  };
}

/**
 * Atalho: retorna true se o usuário logado é admin.
 */
export async function isAdminAtual() {
  const perfil = await getPerfilAtual();
  return perfil?.role === "admin";
}

/**
 * Atualiza o nome do PRÓPRIO perfil do usuário logado.
 * (RLS + trigger no banco garantem que só o campo `nome` muda de fato,
 * mesmo que alguém tente adulterar role/contratante_id por fora.)
 */
export async function atualizarMeuNome(nome) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("perfis")
    .update({ nome })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar nome: ${error.message}`);
  return data;
}

/**
 * Conta quantos associados (clientes) pertencem ao contratante do usuário logado.
 * Se for admin (sem contratante_id próprio), retorna null — não se aplica.
 */
export async function contarMeusAssociados() {
  const perfil = await getPerfilAtual();
  if (!perfil?.contratante_id) return null;

  const { count, error } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("contratante_id", perfil.contratante_id);

  if (error) throw new Error(`Erro ao contar associados: ${error.message}`);
  return count;
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
