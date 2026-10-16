import { Router } from "express";
import { In } from "typeorm";

import { AppDataSource } from "../config/database_postgres.js";

import { PetEntity } from "../entidades/Pet.js";
import { AdocaoEntity } from "../entidades/Adocao.js";
import { AdocaoHistoricoEntity } from "../entidades/AdocaoHistorico.js";

import { NO_CONTENT_STATUS, OK_STATUS } from "../constants/server.js";
import { ROLES } from "../constants/roles.js";
import { STATUS_ADOCAO, STATUS_ATIVOS } from "../constants/adocoes.js";

import { autorizarHandler } from "../middlewares/auth/autorizarHandler.js";
import { verifyIdExistsHandler } from "../middlewares/global/verifyIdExistsHandler.js";

const minhasAdocoesRoutes = new Router();

const adocaoRepository = AppDataSource.getRepository(AdocaoEntity);
const historicoRepository = AppDataSource.getRepository(AdocaoHistoricoEntity);

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
