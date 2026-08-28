# LGPDei

Assistente educativo para identificar gaps de conformidade com a **LGPD** (Lei 13.709/2018) em qualquer contexto de trabalho — tecnologia, RH, saúde, marketing, setor público, etc.

## Stack

- **LGPDeiWeb** — Next.js 15 + React 19 + Tailwind CSS
- **LGPDeiApi** — Python FastAPI + MongoDB + LangGraph + Anthropic Claude

## Pré-requisitos

- Python 3.11+
- Node.js 20+
- Docker (para MongoDB)
- Chave API Anthropic

## Início rápido

### 1. MongoDB

```bash
cd LGPDei
docker compose up -d
```

### 2. API (FastAPI)

```bash
cd LGPDeiApi
cp .env.example .env
# Edite .env e defina ANTHROPIC_API_KEY e SESSION_SECRET

# Windows (se `pip` não for reconhecido, use py):
py -3.12 -m pip install -e ".[dev]"

# Linux/macOS:
python3 -m pip install -e ".[dev]"

# Iniciar servidor
py -3.12 -m uvicorn app.main:app --reload --port 3334
# ou: python3 -m uvicorn app.main:app --reload --port 3334
```

### 3. Frontend (Next.js)

```bash
cd LGPDeiWeb
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

### Autenticação (opcional)

- `/auth` — entrar ou cadastrar conta
- Sessões anônimas continuam funcionando via cookie de sessão
- Usuários logados têm sessões vinculadas à conta

## Funcionalidades

- Sessões anônimas com cookie HttpOnly
- Chat com streaming SSE
- Upload de múltiplos documentos (PDF, DOCX, TXT, MD, CSV)
- Agente LangGraph único com nós: router → chat / assess
- Análise LGPD inline na conversa (sem bloquear chat)
- Rate limiting e TTL de 72h nos dados da sessão

## Aviso legal

Esta ferramenta é educativa e **não substitui assessoria jurídica**.
