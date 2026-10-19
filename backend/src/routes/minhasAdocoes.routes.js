import { Router } from "express";
import { In } from "typeorm";

import { AppDataSource } from "../config/database_postgres.js";

import { PetEntity } from "../entidades/Pet.js";
import { RacaEntity } from "../entidades/Raca.js";
import { AdocaoEntity } from "../entidades/Adocao.js";
import { AdocaoHistoricoEntity } from "../entidades/AdocaoHistorico.js";

import { NO_CONTENT_STATUS, OK_STATUS } from "../constants/server.js";
import { ROLES } from "../constants/roles.js";
import {
  STATUS_ADOCAO,
  STATUS_ADOCAO_VALIDOS,
  STATUS_ATIVOS,
} from "../constants/adocoes.js";

import { autorizarHandler } from "../middlewares/auth/autorizarHandler.js";
import { verifyIdExistsHandler } from "../middlewares/global/verifyIdExistsHandler.js";

import { paraInteiro, responderErros } from "../utils/validacao.js";

const minhasAdocoesRoutes = new Router();

const adocaoRepository = AppDataSource.getRepository(AdocaoEntity);
const historicoRepository = AppDataSource.getRepository(AdocaoHistoricoEntity);
const petRepository = AppDataSource.getRepository(PetEntity);

// Pedidos do lar logado ("Minhas adoções"), do mais recentemente atualizado ao mais antigo,
// cada um com o pet (e a raça) e o histórico do mais antigo ao mais recente.
// Filtros opcionais: status (um ou vários separados por vírgula) e pet_id.
minhasAdocoesRoutes.get(
  "/minhas-adocoes",
  autorizarHandler(ROLES.LAR),
  async (request, response) => {
    const where = { lar_adotivo_id: request.usuario.id };
    const erros = {};

    if (request.query.status !== undefined) {
      const status = String(request.query.status).split(",").map((s) => s.trim().toUpperCase());
      if (status.some((s) => !STATUS_ADOCAO_VALIDOS.includes(s))) {
        erros.status = `status deve ser ${STATUS_ADOCAO_VALIDOS.join(", ")}`;
      } else {
        where.status = In(status);
      }
    }

    if (request.query.pet_id !== undefined) {
      const petId = paraInteiro(request.query.pet_id);
      if (!(petId > 0)) erros.pet_id = "pet_id deve ser um id";
      else where.pet_id = petId;
    }

    if (Object.keys(erros).length) return responderErros(response, erros);

    const adocoes = await adocaoRepository.find({
      where,
      order: { atualizado_em: "DESC", id: "DESC" },
    });
    if (!adocoes.length) return response.status(OK_STATUS).send([]);

    const pets = await petRepository
      .createQueryBuilder("pet")
      .leftJoinAndMapOne("pet.raca", RacaEntity, "raca", "raca.id = pet.raca_id")
      .where("pet.id IN (:...ids)", { ids: [...new Set(adocoes.map((a) => a.pet_id))] })
      .getMany();
    const petPorId = new Map(pets.map((pet) => [pet.id, pet]));

    const historicos = await historicoRepository.find({
      where: { adocao_id: In(adocoes.map((a) => a.id)) },
      order: { criado_em: "ASC", id: "ASC" },
    });

    response.status(OK_STATUS).send(
      adocoes.map((adocao) => ({
        ...adocao,
        pet: petPorId.get(adocao.pet_id),
        historico: historicos.filter((h) => h.adocao_id === adocao.id),
      })),
    );
  },
);

// Pedido do lar logado para o pet (página do pet): em andamento ou já concluído.
// Sem pedido assim responde 204, e o front libera o formulário de adoção.
minhasAdocoesRoutes.get(
  "/pets/:id/minha-adocao",
  autorizarHandler(ROLES.LAR),
  verifyIdExistsHandler(PetEntity, "Pet"),
  async (request, response) => {
    const adocao = await adocaoRepository.findOne({
      where: {
        pet_id: request.registro.id,
        lar_adotivo_id: request.usuario.id,
        status: In([...STATUS_ATIVOS, STATUS_ADOCAO.CONCLUIDA]),
      },
      order: { atualizado_em: "DESC" },
    });

    if (!adocao) return response.status(NO_CONTENT_STATUS).send();

    const historico = await historicoRepository.find({
      where: { adocao_id: adocao.id },
      order: { criado_em: "ASC", id: "ASC" },
    });

    response.status(OK_STATUS).send({ ...adocao, historico });
  },
);

export default minhasAdocoesRoutes;
