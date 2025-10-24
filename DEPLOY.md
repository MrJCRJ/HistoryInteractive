# 🚀 Deploy Guide - History Interactive v2.0

## Plataformas Recomendadas

### 1. 🌐 Render (Mais Fácil)

**Vantagens:**

- ✅ Free tier generoso
- ✅ Deploy automático via Git
- ✅ Suporte MongoDB Atlas nativo
- ✅ SSL gratuito

**Passos:**

1. Crie conta em [render.com](https://render.com)

2. Novo Web Service:

   - Repository: Seu repo GitHub
   - Branch: main
   - Build Command: `npm install`
   - Start Command: `npm start`

3. Variáveis de ambiente:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   SESSION_SECRET=gere-chave-forte-aqui
   ADMIN_USERNAME=seu_admin
   ADMIN_PASSWORD=senha_forte_123
   ```

4. Deploy! (automático em cada push)

**URL:** `https://seu-app.onrender.com`

---

### 2. 🚂 Railway (Melhor Performance)

**Vantagens:**

- ✅ Performance excelente
- ✅ $5 free credit/mês
- ✅ Deploy em 1 clique

**Passos:**

1. Acesse [railway.app](https://railway.app)

2. Deploy from GitHub:

   - Selecione seu repositório
   - Railway detecta Node.js automaticamente

3. Adicione variáveis:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   SESSION_SECRET=chave_aleatoria
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=senha_forte
   ```

4. Deploy!

**URL:** `https://seu-app.up.railway.app`

---

### 3. ☁️ Vercel (Serverless)

**Vantagens:**

- ✅ Edge network global
- ✅ Free tier ilimitado
- ✅ CI/CD automático

**Requer adaptação:**

1. Criar `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-fastify.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server-fastify.js"
    }
  ]
}
```

2. Modificar `server-fastify.js`:

```javascript
// Adicionar no final:
module.exports = fastify;
```

3. Deploy:

```bash
npm i -g vercel
vercel
```

**Nota:** Vercel funciona melhor com Next.js. Para Fastify, prefira Render/Railway.

---

### 4. 🪂 Fly.io (Container)

**Vantagens:**

- ✅ Global edge network
- ✅ Free tier com 3 VMs
- ✅ Ideal para Fastify

**Passos:**

1. Instalar Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Login:

```bash
fly auth login
```

3. Criar `fly.toml`:

```toml
app = "history-interactive"
primary_region = "gru" # São Paulo

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

4. Deploy:

```bash
fly launch
fly secrets set MONGODB_URI="mongodb+srv://..."
fly secrets set SESSION_SECRET="chave_forte"
fly secrets set ADMIN_USERNAME="admin"
fly secrets set ADMIN_PASSWORD="senha"
fly deploy
```

---

## 🔒 Checklist de Segurança para Produção

### Antes do Deploy

- [ ] `NODE_ENV=production` configurado
- [ ] `SESSION_SECRET` com chave forte (32+ caracteres)
- [ ] `ADMIN_PASSWORD` alterado do padrão
- [ ] MongoDB IP whitelist configurado (ou 0.0.0.0/0)
- [ ] `.env` adicionado ao `.gitignore`
- [ ] Certificado SSL ativo (HTTPS)
- [ ] Secrets não commitados no Git

### Gerar SESSION_SECRET forte:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Online (use com cuidado)
https://randomkeygen.com/
```

---

## 📊 Monitoramento em Produção

### Logs Básicos (inclusos)

O servidor já loga:

- ✅ Requisições (método, URL, IP)
- ✅ Tentativas de login
- ✅ Conexão MongoDB
- ✅ Erros com stack trace

### Ferramentas Recomendadas

1. **Logs:** [Logtail](https://logtail.com/) (free tier)
2. **Uptime:** [UptimeRobot](https://uptimerobot.com/) (free)
3. **Analytics:** [Google Analytics](https://analytics.google.com/) (free)
4. **Errors:** [Sentry](https://sentry.io/) (free tier)

---

## 🗄️ MongoDB Atlas Production Config

### Network Access

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com)
2. Network Access → Add IP Address
3. Opções:
   - **Específico:** IP do servidor (mais seguro)
   - **Qualquer:** `0.0.0.0/0` (serverless)

### Database User

1. Database Access → Add New User
2. Username/Password (não use caracteres especiais na senha)
3. Permissões: `readWrite` no database `history_interactive`

### Connection String

```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?appName=Cluster0
```

**Importante:** Codifique caracteres especiais na senha!

---

## 🔄 CI/CD Automático

### GitHub Actions (exemplo)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests (se tiver)
        run: npm test || true

      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            https://api.render.com/deploy/srv-xxxxx?key=$RENDER_API_KEY
```

---

## 🌍 Domínio Customizado

### Render/Railway/Fly.io

1. Compre domínio (Namecheap, GoDaddy, etc.)
2. Configurar DNS:
   ```
   Type: CNAME
   Name: @
   Value: seu-app.onrender.com
   ```
3. Adicionar domínio no dashboard da plataforma
4. SSL automático em ~10min

---

## 📈 Escalabilidade

### Quando escalar?

| Métrica               | Limite | Ação                |
| --------------------- | ------ | ------------------- |
| CPU > 80%             | 5min+  | Adicionar instância |
| Memory > 90%          | 5min+  | Aumentar RAM        |
| Response time > 500ms | P95    | Otimizar queries    |
| Error rate > 1%       | -      | Investigar          |

### Horizontal Scaling

Fastify + MongoDB Atlas suporta múltiplas instâncias:

```
Load Balancer
    ↓
┌───┴───┬───────┬───────┐
│ App 1 │ App 2 │ App 3 │
└───┬───┴───┬───┴───┬───┘
    └───────┴───────┘
         ↓
   MongoDB Atlas
```

**Nota:** Sessões persistem via MongoDB, não memória local!

---

## 🔧 Troubleshooting Production

### Erro: "Cannot connect to MongoDB"

1. Verifique `MONGODB_URI` nas variáveis de ambiente
2. Confirme IP na whitelist do Atlas
3. Teste conexão local:
   ```bash
   mongo "mongodb+srv://cluster.mongodb.net/" --username seu_usuario
   ```

### Erro: "Session not persisting"

1. Verifique `SESSION_SECRET` está definido
2. Confirme cookies funcionam (HTTPS necessário em prod)
3. Check MongoDB connection (sessões armazenadas lá)

### Erro 502/503

1. Server não iniciou (check logs)
2. Port binding incorreto (use `PORT` env var)
3. Health check failing (configure em platform)

### App lento em produção

1. Adicione índices no MongoDB:
   ```javascript
   db.stories.createIndex({ date_created: -1 });
   db.chapters.createIndex({ story_id: 1, chapter_number: 1 });
   ```
2. Enable compression:
   ```bash
   npm install @fastify/compress
   ```
3. Use CDN para assets estáticos

---

## 💰 Custos Estimados

### Free Tier (até ~10k usuários/mês)

| Serviço       | Plano | Custo      |
| ------------- | ----- | ---------- |
| Render        | Free  | $0         |
| MongoDB Atlas | M0    | $0         |
| Domínio       | .com  | $12/ano    |
| **Total**     | -     | **$1/mês** |

### Production (até ~100k usuários/mês)

| Serviço       | Plano   | Custo       |
| ------------- | ------- | ----------- |
| Render        | Starter | $7/mês      |
| MongoDB Atlas | M2      | $9/mês      |
| Domínio       | .com    | $1/mês      |
| **Total**     | -       | **$17/mês** |

### Scale (até 1M usuários/mês)

| Serviço          | Plano | Custo       |
| ---------------- | ----- | ----------- |
| Railway          | Pro   | $20/mês     |
| MongoDB Atlas    | M10   | $57/mês     |
| CDN (Cloudflare) | Free  | $0          |
| **Total**        | -     | **$77/mês** |

---

## 🎯 Checklist Final de Deploy

### Pré-Deploy

- [ ] Código commitado e pushed
- [ ] `.env` não está no Git
- [ ] Dependências atualizadas (`npm audit`)
- [ ] Testado localmente em produção mode
- [ ] MongoDB Atlas configurado
- [ ] Secrets gerados (SESSION_SECRET)

### Deploy

- [ ] Plataforma escolhida (Render/Railway/Fly.io)
- [ ] Variáveis de ambiente configuradas
- [ ] Build bem-sucedido
- [ ] Health check passando
- [ ] SSL/HTTPS ativo

### Pós-Deploy

- [ ] Testado em produção (login, CRUD, leitura)
- [ ] Logs monitorados (primeiros 10min)
- [ ] Performance verificada (Lighthouse)
- [ ] Domínio configurado (opcional)
- [ ] Uptime monitoring ativo

---

## 🚀 Deploy em 5 Minutos (Quick Start)

```bash
# 1. Push para GitHub
git add .
git commit -m "Deploy v2.0"
git push origin main

# 2. Render Deploy
# Acesse render.com → New Web Service → Connect GitHub

# 3. Configure
Build: npm install
Start: npm start
Env vars: Copy de .env

# 4. Deploy!
# Aguarde ~3min

# 5. Teste
curl https://seu-app.onrender.com
```

---

**Pronto para produção! 🎉**

Em caso de dúvidas, consulte:

- [Fastify Production Checklist](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)
- [MongoDB Atlas Deployment](https://www.mongodb.com/docs/atlas/getting-started/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

_Guia de deploy atualizado em Outubro 2025 | v2.0.0_
