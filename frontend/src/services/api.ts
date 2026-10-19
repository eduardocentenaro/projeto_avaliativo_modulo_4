import axios from "axios";
import { getSessao, limparSessao } from "./sessao";

const api = axios.create({
  baseURL: import.meta.env.VITE_URL_API,
});

// Passagem automática do token direto no headers das requisições
api.interceptors.request.use((config) => {
  const sessao = getSessao();
  if (sessao) {
    config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

// Token recusado pela API (expirado ou inválido): encerra a sessão e leva ao login,
// voltando depois para a tela atual. O login em si também responde erro, mas sem token.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const enviouToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && enviouToken) {
      limparSessao();
      const destino = window.location.pathname;
      window.location.assign(`/login?expirada=1&voltar=${encodeURIComponent(destino)}`);
    }
    return Promise.reject(error);
  }
);

export default api;
