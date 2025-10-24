# 🚀 Guia de Deploy no Vercel

Este guia mostra como fazer o deploy do History Interactive no Vercel.

## ⚠️ Configurações Obrigatórias

### 1. Variáveis de Ambiente

Antes do deploy, configure estas variáveis no Vercel Dashboard:

```bash
# MongoDB Atlas (OBRIGATÓRIO)
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster.mongodb.net/?appName=Cluster0

# Admin (OBRIGATÓRIO)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Session (OBRIGATÓRIO)
SESSION_SECRET=sua-chave-secreta-aleatoria-aqui

# Ambiente (Automático no Vercel)
NODE_ENV=production
PORT=3000
```

### 2. Como Configurar Variáveis no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto `history-interactive`
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável acima
5. Clique em **Save**

## 📋 Pré-requisitos

### MongoDB Atlas Setup

1. Acesse: https://cloud.mongodb.com/
2. Crie um cluster (gratuito)
3. Em **Network Access**, adicione `0.0.0.0/0` (permite qualquer IP)
4. Em **Database Access**, crie um usuário com permissões de leitura/escrita
5. Copie a **Connection String** e substitua `<password>` pela senha do usuário
6. Use essa string na variável `MONGODB_URI` do Vercel

## 🔧 Arquivos de Configuração

O projeto já possui os arquivos necessários para deploy no Vercel:

### `vercel.json`
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
      "src": "/public/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "server-fastify.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### `index.js`
Entry point que aponta para `server-fastify.js` (requerido pelo Vercel).

## 🚀 Deploy

### Via GitHub (Recomendado)

1. Push seu código para o GitHub:
```bash
git add .
git commit -m "Deploy no Vercel"
git push origin main
```

2. No Vercel Dashboard:
   - Clique em **Add New** → **Project**
   - Selecione o repositório `history-interactive`
   - Configure as variáveis de ambiente
   - Clique em **Deploy**

### Via Vercel CLI

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## ✅ Checklist de Deploy

- [ ] MongoDB Atlas configurado e acessível
- [ ] `MONGODB_URI` configurado no Vercel
- [ ] `ADMIN_USERNAME` configurado no Vercel
- [ ] `ADMIN_PASSWORD` configurado no Vercel (use senha forte!)
- [ ] `SESSION_SECRET` configurado no Vercel (use chave aleatória)
- [ ] IP `0.0.0.0/0` na whitelist do MongoDB Atlas
- [ ] Arquivos `index.js` e `vercel.json` no repositório
- [ ] Push do código para o GitHub
- [ ] Deploy realizado no Vercel

## 🐛 Troubleshooting

### Erro: "No entrypoint found"

**Solução**: Certifique-se que `index.js` existe na raiz do projeto.

### Erro: "Cannot connect to MongoDB"

**Soluções**:
1. Verifique se `MONGODB_URI` está configurado no Vercel
2. Verifique se o IP `0.0.0.0/0` está na whitelist do MongoDB Atlas
3. Verifique se o usuário do MongoDB tem permissões corretas

### Erro: "Session secret not configured"

**Solução**: Configure `SESSION_SECRET` nas variáveis de ambiente do Vercel.

### CSS/JS não carregam

**Solução**: O Fastify usa o prefixo `/public/` para arquivos estáticos. As views já estão configuradas corretamente com `href="/public/css/main.css"`.

### Admin não funciona

**Soluções**:
1. Verifique se `ADMIN_USERNAME` e `ADMIN_PASSWORD` estão configurados
2. Acesse `/secret-admin-login` diretamente
3. Verifique os logs de runtime no Vercel Dashboard

## 📊 Monitoramento

Após o deploy, monitore:

1. **Runtime Logs**: Vercel Dashboard → Deployment → Runtime Logs
2. **Build Logs**: Vercel Dashboard → Deployment → Build Logs
3. **Observability**: Vercel Dashboard → Analytics → Observability

## 🔒 Segurança em Produção

**IMPORTANTE**: Após o primeiro deploy, altere:

1. ✅ Senha do admin (`ADMIN_PASSWORD`)
2. ✅ Session secret (`SESSION_SECRET`) - use: `openssl rand -hex 32`
3. ✅ Restrinja IPs no MongoDB Atlas (remova `0.0.0.0/0` se possível)
4. ✅ Configure HTTPS (automático no Vercel)

## 🌐 URLs Após Deploy

- **Homepage**: `https://seu-projeto.vercel.app`
- **Admin**: `https://seu-projeto.vercel.app/secret-admin-login`
- **API Health**: Não há endpoint de health, mas acesse `/` para verificar

## 🔄 Atualizações

Para atualizar o projeto:

```bash
# Faça suas alterações
git add .
git commit -m "Suas alterações"
git push origin main

# Vercel fará deploy automático
```

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Fastify Docs**: https://fastify.dev/

---

**✅ Configuração completa!** Seu projeto está pronto para deploy no Vercel.
