# 🟡 Pac-Man Retrô

![Pac-Man Banner](https://img.shields.io/badge/Pac--Man-Retrô-ffcc00?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-Seguro-003b57?style=flat-square&logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Alpine-2496ED?style=flat-square&logo=docker)

> Uma aplicação web completa do clássico jogo Pac-Man, com backend em **Node.js + SQLite**, frontend em **HTML5 Canvas puro**, sons **sintetizados via Web Audio API** e **Dockerizado** para deploy rápido.

---

## 📋 Índice

- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
  - [Local (sem Docker)](#local-sem-docker)
  - [Com Docker](#com-docker)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [API REST](#api-rest)
- [Segurança](#segurança)
- [Mecânica do Jogo](#mecânica-do-jogo)
- [Sons Sintetizados](#sons-sintetizados)
- [Dockerização](#dockerização)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Possíveis Melhorias](#possíveis-melhorias)
- [Licença](#licença)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     Navegador                            │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────┐  │
│  │ index.html│   │ game.js  │   │ Web Audio API     │  │
│  │ (UI/Login)│   │ (Motor)  │   │ (Sons sintetizados)│  │
│  └──────────┘   └──────────┘   └────────────────────┘  │
│         │               │                                │
│         └───────┬───────┘                                │
│                 │ fetch()                                │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 Node.js (server.js)                      │
│  ┌──────────┐   ┌────────────┐   ┌──────────────────┐  │
│  │ Express   │   │ bcryptjs   │   │ better-sqlite3   │  │
│  │ (REST)    │   │ (hash senha)│   │ (queries param.) │  │
│  └──────────┘   └────────────┘   └──────────────────┘  │
│                                      │                   │
│                                      ▼                   │
│                              ┌──────────────┐            │
│                              │  SQLite DB   │            │
│                              │ (users,      │            │
│                              │  sessions,   │            │
│                              │  scores)     │            │
│                              └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Stack

| Camada    | Tecnologia                    | Função                          |
|-----------|-------------------------------|---------------------------------|
| Frontend  | HTML5 + Canvas API + JS puro  | Jogo, sons, UI                  |
| Backend   | Node.js + Express             | API REST                        |
| Banco     | SQLite (better-sqlite3)       | Persistência local              |
| Senhas    | bcryptjs (cost factor 12)     | Hash seguro                     |
| Sessão    | crypto (token aleatório 32B)  | Autenticação stateless          |
| Contêiner | Docker Alpine                 | Empacotamento leve              |

---

## Funcionalidades

### Jogo
- 🎮 **Pac-Man clássico** controlado pelas setas do teclado
- 👻 **2 fantasmas** com IA de perseguição (Blinky persegue direto, Pinky mira 2 tiles à frente)
- 🟡 **Power pellets** que deixam fantasmas azuis e vulneráveis
- 🔄 **Túneis** nas bordas laterais (wrap-around)
- 🧱 **Mapa 21×21** com ghost house, portas e corredores
- 📊 **Pontuação** com combo ao comer múltiplos fantasmas (200 → 400 → 800 → 1600)
- ❤️ **Sistema de vidas** (3 iniciais)
- 🆙 **Progressão de nível** (velocidade aumenta a cada nível)

### Áudio (Web Audio API — sem MP3)
- 🔊 Som de **comer pastilha** (bip ascendente de 320→480 Hz)
- 🔊 Som de **power pellet** (sawtooth ascendente 180→680 Hz)
- 🔊 Som de **comer fantasma** (bip agudo 700→1100 Hz)
- 🔊 Som de **morte** (sawtooth descendente 520→40 Hz)
- 🔊 **Introdução** (arpejo C-E-G-C)
- 🔊 **Nível completo** (escala ascendente de 6 notas)

### Autenticação e Segurança
- 🔐 **Login e registro** por e-mail + senha com bcrypt (cost 12)
- 🛡️ **Imune a SQL Injection** — todas queries usam parâmetros nomeados
- 🧹 **Sanitização** de inputs (remoção de `< > & ' "`, limite de 255 caracteres)
- 📧 **Validação** de formato de e-mail via regex
- 🔑 **Tokens de sessão** aleatórios (32 bytes hex) armazenados em tabela separada
- 🚪 **Logout** remove o token do banco

### High Scores
- 🏆 **Top 10** (configurável via query `?limit=`)
- 📝 **Submissão autenticada** — apenas usuários logados podem pontuar
- 📊 **Ordenação decrescente** por pontuação

---

## Pré-requisitos

- **Node.js** 20+ (para execução local)
- **Docker** + **Docker Compose** (para execução conteinerizada)
- Navegador moderno (Chrome, Firefox, Edge) — necessário para Web Audio API

---

## Instalação e Execução

### Local (sem Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/pacman-app.git
cd pacman-app

# 2. Instale as dependências
npm install

# 3. Execute o servidor
npm start

# 4. Acesse no navegador
#    → http://localhost:3000
```

O banco SQLite será criado automaticamente em `./data/pacman.db`.

### Com Docker

```bash
# 1. Build e execute com Docker Compose
docker compose up -d --build

# 2. Acesse no navegador
#    → http://localhost:3000

# Para parar:
docker compose down
```

O banco de dados será persistido em `./pacman-data/production.db` no host.

---

## Estrutura de Arquivos

```
pacman-app/
├── package.json          # Dependências e scripts
├── server.js             # Servidor Express + SQLite + API
├── public/
│   ├── index.html        # Interface HTML (login + jogo)
│   └── game.js           # Motor completo do Pac-Man (~700 linhas)
├── Dockerfile            # Build da imagem Node Alpine
├── docker-compose.yml    # Orquestração do contêiner
└── pacman-data/          # (criado automaticamente) Banco SQLite persistido
```

---

## API REST

Toda a API é servida em `http://localhost:3000/api/`.

### Autenticação

| Método | Rota             | Corpo                         | Resposta                    |
|--------|------------------|-------------------------------|-----------------------------|
| POST   | `/api/register`  | `{ email, password }`         | `{ token, email }`          |
| POST   | `/api/login`     | `{ email, password }`         | `{ token, email }`          |
| POST   | `/api/logout`    | — (Bearer token)              | `{ ok: true }`              |
| GET    | `/api/me`        | — (Bearer token)              | `{ id, email, created_at }` |

### Pontuação

| Método | Rota             | Autenticação | Corpo/Query              | Resposta                    |
|--------|------------------|--------------|--------------------------|-----------------------------|
| GET    | `/api/scores`    | ❌           | `?limit=10`              | `[{score, player_email, created_at}]` |
| POST   | `/api/scores`    | ✅ Bearer    | `{ score }`              | `{ ok: true }`              |

> **Exemplo de requisição autenticada:**
> ```http
> POST /api/scores
> Authorization: Bearer <seu-token>
> Content-Type: application/json
>
> { "score": 12500 }
> ```

### Códigos de Erro

| Status | Significado                    |
|--------|--------------------------------|
| 400    | Dados inválidos (e-mail, senha, score) |
| 401    | Token ausente ou inválido      |
| 409    | E-mail já cadastrado           |
| 500    | Erro interno do servidor       |

---

## Segurança

### SQL Injection — Zero

Todas as queries usam **prepared statements** do `better-sqlite3`. Nenhuma string é concatenada em SQL:

```javascript
// ❌ NUNCA — vulnerável a SQL Injection
db.run(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ SEMPRE — queries parametrizadas
db.prepare('SELECT * FROM users WHERE email = ?').get(email);
```

### Senhas — bcrypt com cost factor 12

```javascript
const hash = bcrypt.hashSync(password, 12);       // ~250ms por hash
const match = bcrypt.compareSync(password, hash);  // verificação segura
```

### Sanitização de Inputs

```javascript
function sanitize(v) {
  if (typeof v !== 'string') return '';
  return v.trim().replace(/[<>&'"]/g, '').slice(0, 255);
}
```

### Tokens de Sessão

```javascript
const token = crypto.randomBytes(32).toString('hex');  // 64 caracteres hex
// Armazenado em tabela separada com FK para users
// Removido no logout
```

---

## Mecânica do Jogo

### Mapa

O mapa é uma matriz **21×21** onde cada célula representa um tile de 20×20 pixels:

| Valor | Tile            | Descrição                            |
|-------|-----------------|--------------------------------------|
| 0     | `EMPTY`         | Caminho vazio                        |
| 1     | `WALL`          | Parede (intransponível)              |
| 2     | `DOT`           | Pastilha (+10 pontos)                |
| 3     | `POWER`         | Power pellet (+50 pontos)            |
| 4     | `GHOUSE`        | Parede da ghost house (só fantasmas) |
| 5     | `DOOR`          | Porta da ghost house (só fantasmas)  |

### Entidades

**Pac-Man:**
- Velocidade inicial: 5.5 tiles/s (aumenta +0.2 por nível)
- Controlado por **setas do teclado**
- Direção é enfileirada e executada quando alinhado ao tile
- Colisão com fantasma = perde vida (a menos que esteja no modo fright)

**Fantasmas:**
- Velocidade inicial: 5.0 tiles/s (aumenta +0.15 por nível)
- **Blinky** (vermelho): persegue diretamente o tile do Pac-Man
- **Pinky** (rosa): persegue 2 tiles à frente do Pac-Man
- No modo **fright**: fogem para os cantos do mapa
- Saindo da ghost house um de cada vez (delay de 1.5s)

### Máquina de Estados

```
IDLE → (ESPAÇO) → READY → (1.2s) → PLAYING → (morte) → DYING → (1.5s)
                                                              ↓
                                              lives > 0 → READY (respawn)
                                              lives = 0 → GAMEOVER → (ESPAÇO) → IDLE
                                                              
PLAYING → (todos dots) → WIN → (2.0s) → nextLevel() → PLAYING
```

### Pontuação

| Ação                    | Pontos  |
|-------------------------|---------|
| Pastilha comum          | 10      |
| Power pellet            | 50      |
| 1º fantasma (fright)    | 200     |
| 2º fantasma (mesmo PP)  | 400     |
| 3º fantasma (mesmo PP)  | 800     |
| 4º fantasma (mesmo PP)  | 1.600   |

---

## Sons Sintetizados

Todos os sons são gerados em tempo real pela **Web Audio API**, sem arquivos externos.

```javascript
// Exemplo: som de "comer fantasma"
eatGhost() {
  this._tone(700, 0.08, 'square', 0.10);
  setTimeout(() => this._tone(1100, 0.12, 'square', 0.10), 80);
}
```

| Efeito          | Oscilador | Frequência          | Duração |
|-----------------|-----------|---------------------|---------|
| Chomp           | Square    | 320 → 480 Hz        | 60 ms   |
| Power pellet    | Sawtooth  | 180 → 680 Hz        | 350 ms  |
| Comer fantasma  | Square    | 700 → 1100 Hz       | 200 ms  |
| Morte           | Sawtooth  | 520 → 40 Hz         | 1.0 s   |
| Game start      | Square    | 260, 330, 390, 520  | 720 ms  |
| Nível completo  | Square    | 400→500→600→800→1000→1300 | 600 ms |

> ℹ️ O `AudioContext` é criado na primeira interação do usuário (autoplay policy dos navegadores).

---

## Dockerização

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm cache clean --force

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Base **Alpine Linux** (~120 MB de imagem final).

### Docker Compose

```yaml
version: '3.8'

services:
  pacman:
    build: .
    environment:
      - PORT=3000
      - DB_PATH=/opt/pacman-data/production.db
    volumes:
      - ./pacman-data:/opt/pacman-data
```

**Comportamento:**
- Banco SQLite em `/opt/pacman-data/production.db` dentro do contêiner
- Volume bind para `./pacman-data/` no host → dados persistem entre execuções
- Sem exposição de portas no `docker-compose.yml` (isola a aplicação)

---

## Variáveis de Ambiente

| Variável    | Padrão                          | Descrição                    |
|-------------|---------------------------------|------------------------------|
| `PORT`      | `3000`                          | Porta do servidor            |
| `DB_PATH`   | `./data/pacman.db`              | Caminho do arquivo SQLite    |

### Configuração

```bash
# Linux / macOS
export PORT=3000
export DB_PATH=/caminho/personalizado/pacman.db
npm start

# Windows (CMD)
set PORT=3000
set DB_PATH=C:\dados\pacman.db
npm start

# Windows (PowerShell)
$env:PORT=3000
$env:DB_PATH="C:\dados\pacman.db"
npm start
```

---

## Possíveis Melhorias

- [ ] **Mais fantasmas** — adicionar Inky (ciano) e Clyde (laranja) com IAs distintas
- [ ] **Modo scatter** — cada fantasma tem um canto para o qual se dirige periodicamente
- [ ] **Efeitos visuais** — animação de frutas bônus, partículas ao comer fantasma
- [ ] **Som de fundo** — loop de sirene quando em modo fright
- [ ] **Leaderboard global** — página separada com histórico completo
- [ ] **Mobile** — controles touch na tela
- [ ] **WebSockets** — multiplayer ou espectador ao vivo
- [ ] **Temas de mapa** — mapas alternativos selecionáveis

---

## Licença

MIT © 2025 — Projeto educacional e de demonstração.

**Pac-Man** é propriedade da Bandai Namco Entertainment. Este é um projeto **educacional/fan-made** sem fins comerciais. Inspirado no clássico original de 1980 por Tōru Iwatani.
