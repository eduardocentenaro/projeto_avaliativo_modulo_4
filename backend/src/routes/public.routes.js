import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { AppDataSource } from "../config/database_postgres.js";

import { UsuarioEntity } from "../entidades/Usuario.js";
import { LarAdotivoEntity } from "../entidades/LarAdotivo.js";
import { PetEntity } from "../entidades/Pet.js";
import { TipoEntity } from "../entidades/Tipo.js";
import { RacaEntity } from "../entidades/Raca.js";
import { CorEntity } from "../entidades/Cor.js";

import { BAD_REQUEST_STATUS, OK_STATUS } from "../constants/server.js";
import { ROLES } from "../constants/roles.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../constants/auth.js";
import { PORTES } from "../constants/pets.js";
import { SITUACAO_PET } from "../constants/adocoes.js";

import { buscarSituacoes } from "../utils/situacaoPet.js";
import { paraInteiro, responderErros } from "../utils/validacao.js";

const publicRoutes = new Router();

const usuarioRepository = AppDataSource.getRepository(UsuarioEntity);
const larRepository = AppDataSource.getRepository(LarAdotivoEntity);
const petRepository = AppDataSource.getRepository(PetEntity);

// Consulta base dos pets já com tipo, raça e cor como objetos (as entidades não declaram relações)
const consultaPets = () =>
  petRepository
    .createQueryBuilder("pet")
    .leftJoinAndMapOne("pet.tipo", TipoEntity, "tipo", "tipo.id = pet.tipo_id")
    .leftJoinAndMapOne("pet.raca", RacaEntity, "raca", "raca.id = pet.raca_id")
    .leftJoinAndMapOne("pet.cor", CorEntity, "cor", "cor.id = pet.cor_id");

const gerarToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

publicRoutes.post("/auth/login", async (request, response) => {
  const dados = request.body ?? {};

  if (!dados.email || !dados.senha) {
    response
      .status(BAD_REQUEST_STATUS)
      .send({ error: "email e senha são obrigatórios" });
    return;
  }

  const email = String(dados.email).trim().toLowerCase();

  const usuario = await usuarioRepository.findOneBy({ email });
  const lar = usuario
    ? null
    : await larRepository
        .createQueryBuilder("lar")
        .addSelect("lar.senha")
        .where("lar.email = :email", { email })
        .getOne();
  const conta = usuario || lar;

  const senhaCorreta = conta && (await bcrypt.compare(String(dados.senha), conta.senha));

  if (!senhaCorreta) {
    response.status(BAD_REQUEST_STATUS).send({
      error: "Credenciais incorretas",
    });
    return;
  }

  const role = usuario ? usuario.role : ROLES.LAR;

  response.status(OK_STATUS).send({
    id: conta.id,
    nome: conta.nome,
    email: conta.email,
    role,
    token: gerarToken(conta.id, role),
  });
});

// Vitrine: pets ainda não adotados nem arquivados (disponíveis, em processo e reservados)
publicRoutes.get("/pets-disponiveis", async (request, response) => {
  const { tipo_id, porte, busca } = request.query;
  const erros = {};

  const tipoId = tipo_id === undefined ? undefined : paraInteiro(tipo_id);
  if (Number.isNaN(tipoId)) erros.tipo_id = "tipo_id deve ser um número inteiro";

  const porteFiltro = porte === undefined ? undefined : String(porte).toUpperCase();
  if (porteFiltro !== undefined && !PORTES.includes(porteFiltro)) {
    erros.porte = `porte deve ser ${PORTES.join(", ")}`;
  }

  if (Object.keys(erros).length) return responderErros(response, erros);

  const consulta = consultaPets()
    .where("pet.arquivado_em IS NULL")
    .orderBy("pet.nome", "ASC");

  if (tipoId !== undefined) consulta.andWhere("pet.tipo_id = :tipoId", { tipoId });
  if (porteFiltro) consulta.andWhere("pet.porte = :porte", { porte: porteFiltro });
  if (busca && String(busca).trim()) {
    consulta.andWhere("(pet.nome ILIKE :busca OR raca.nome ILIKE :busca)", {
      busca: `%${String(busca).trim()}%`,
    });
  }

  const pets = await consulta.getMany();
  const situacoes = await buscarSituacoes(pets.map((pet) => pet.id));

  const vitrine = pets
    .map((pet) => ({ ...pet, situacao: situacoes.get(pet.id) || SITUACAO_PET.DISPONIVEL }))
    .filter((pet) => pet.situacao !== SITUACAO_PET.ADOTADO);

  response.status(OK_STATUS).send(vitrine);
});

export default publicRoutes;
