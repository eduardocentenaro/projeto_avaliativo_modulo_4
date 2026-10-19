import { Router } from "express";
import { In } from "typeorm";

import { AppDataSource } from "../config/database_postgres.js";

import { PetEntity } from "../entidades/Pet.js";
import { AdocaoEntity } from "../entidades/Adocao.js";
import { AdocaoHistoricoEntity } from "../entidades/AdocaoHistorico.js";

import {
  CONFLICT_STATUS,
  CREATED_STATUS,
  NOT_FOUND_STATUS,
} from "../constants/server.js";
import { ROLES } from "../constants/roles.js";
import {
  SITUACAO_PET,
  STATUS_ADOCAO,
  STATUS_ATIVOS,
} from "../constants/adocoes.js";

import { autorizarHandler } from "../middlewares/auth/autorizarHandler.js";
import { validarAdocao } from "../middlewares/validacoes/validarAdocao.js";

import { buscarSituacao } from "../utils/situacaoPet.js";

const adocoesRoutes = new Router();

const OBSERVACAO_PEDIDO_ENVIADO = "Pedido enviado pelo lar.";

// erro com status HTTP, tratado pelo errorHandler global
const erroHttp = (status, mensagem) =>
  Object.assign(new Error(mensagem), { status });

// Pedido de adoção do lar logado. O lar vem do token, nunca do body.
adocoesRoutes.post(
  "/adocoes",
  autorizarHandler(ROLES.LAR),
  validarAdocao,
  async (request, response) => {
    const { pet_id, motivo, experiencia, tempo_sozinho } = request.dadosAdocao;
    const larId = request.usuario.id;

    try {
      const adocao = await AppDataSource.transaction(async (manager) => {
        // trava a linha do pet: pedidos simultâneos para o mesmo pet esperam este terminar
        const pet = await manager
          .getRepository(PetEntity)
          .createQueryBuilder("pet")
          .setLock("pessimistic_write")
          .where("pet.id = :id", { id: pet_id })
          .getOne();

        if (!pet) throw erroHttp(NOT_FOUND_STATUS, "Pet não encontrado");
        if (pet.arquivado_em) {
          throw erroHttp(CONFLICT_STATUS, "Este pet não está mais disponível para adoção");
        }

        const adocaoRepository = manager.getRepository(AdocaoEntity);

        const pedidoEmAndamento = await adocaoRepository.findOneBy({
          pet_id,
          lar_adotivo_id: larId,
          status: In(STATUS_ATIVOS),
        });
        if (pedidoEmAndamento) {
          throw erroHttp(CONFLICT_STATUS, "Você já tem um pedido em andamento para este pet");
        }

        const situacao = await buscarSituacao(pet_id, manager);
        if (situacao === SITUACAO_PET.ADOTADO) {
          throw erroHttp(CONFLICT_STATUS, "Este pet já foi adotado");
        }
        if (situacao === SITUACAO_PET.RESERVADO) {
          throw erroHttp(CONFLICT_STATUS, "Este pet já está reservado para outro lar");
        }

        const novaAdocao = await adocaoRepository.save({
          pet_id,
          lar_adotivo_id: larId,
          status: STATUS_ADOCAO.ANALISE,
          motivo,
          experiencia,
          tempo_sozinho,
        });

        const primeiraEtapa = await manager.getRepository(AdocaoHistoricoEntity).save({
          adocao_id: novaAdocao.id,
          status: STATUS_ADOCAO.ANALISE,
          observacao: OBSERVACAO_PEDIDO_ENVIADO,
          usuario_id: null,
        });

        return { ...novaAdocao, historico: [primeiraEtapa] };
      });

      response.status(CREATED_STATUS).send(adocao);
    } catch (error) {
      // índice único do banco: outro pedido igual foi gravado ao mesmo tempo
      if (error.code === "23505") {
        throw erroHttp(CONFLICT_STATUS, "Você já tem um pedido em andamento para este pet");
      }
      throw error;
    }
  },
);

export default adocoesRoutes;
