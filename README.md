# Lab365PetAmigo

Plataforma de adoção responsável de cães e gatos: aproxima pets resgatados por uma ONG de lares
interessados em adotá-los. Projeto avaliativo do curso Desenvolvimento Web FullStack, feito a partir do
[template oficial](https://github.com/Desenvolvimento-WEB-FullStack/template_projeto_pets_m3).

## Estrutura

```text
/
├── backend/    API REST — Node.js, Express, TypeORM e PostgreSQL
└── frontend/   Interface — React, Vite e React Router
```

## Como rodar

1. **Back-end** (`backend/`): copie `.env_example` para `.env`, preencha os dados do banco e o `JWT_SECRET`, e rode:

   ```bash
   npm install
   npm run db:subir   # PostgreSQL no Docker (ou use um PostgreSQL local)
   npm run db:criar
   npm run seed:all
   npm start          # http://localhost:8888
   ```

2. **Front-end** (`frontend/`): copie `.env.example` para `.env` e rode:

   ```bash
   npm install
   npm run dev
   ```

Detalhes de rotas, seeds e contas de teste estão em [backend/README.md](backend/README.md) e
[frontend/README.md](frontend/README.md).

## Fluxo de trabalho

- `main`: apenas a versão final de entrega.
- `develop`: integração.
- `feature/*` e `fix/*`: criadas a partir de `develop` e integradas por Pull Request.

## Equipe

- Eduardo Centenaro
