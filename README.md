# 📖 Histórias Interativas - Plataforma de Narrativas Dramáticas

Uma plataforma imersiva para criação e leitura de **histórias interativas baseadas em eventos reais**, onde cada decisão do leitor molda o destino dos personagens através de dilemas morais complexos e situações intensas.

## 🎭 Sobre o Projeto

Esta plataforma foi desenvolvida para criar narrativas não-lineares com múltiplas ramificações, explorando temas como:

- **Drama Real**: Histórias baseadas em eventos que poderiam acontecer na vida real
- **Crime e Justiça**: Dilemas legais, morais e éticos em situações extremas
- **Suspense Psicológico**: Tensão mental, paranoia e decisões sob pressão
- **Dilema Moral**: Escolhas difíceis sem respostas certas ou erradas
- **Conflito Familiar**: Relacionamentos complexos e segredos de família
- **Decisões Profissionais**: Ética no trabalho e consequências de escolhas profissionais
- **Sobrevivência**: Situações limite onde cada decisão importa
- **Mistério Real**: Investigações e revelações impactantes

### ✨ Características

- 📚 **Sistema de capítulos ramificados** com múltiplos finais possíveis
- 🎯 **Escolhas consequentes** que alteram significativamente a narrativa
- 💾 **Progresso salvo automaticamente** por sessão de leitura
- 🌙 **Modo de leitura imersivo** (Modo Foco) para experiência cinematográfica
- 🔐 **Painel administrativo protegido** para gerenciar histórias
- 🎨 **Design dramático e envolvente** com tipografia literária
- 📱 **Responsivo** para leitura em qualquer dispositivo

## 🚀 Tecnologias Utilizadas

- **Node.js** (v20.x) - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Banco de dados leve e eficiente
- **EJS** - Template engine para as views
- **Bcrypt** - Criptografia de senhas
- **Express-Session** - Gerenciamento de sessões

## 📦 Instalação

### Pré-requisitos

- Node.js versão 20 ou superior
- npm (geralmente instalado junto com o Node.js)

### Passos

1. Clone o repositório:

```bash
git clone <seu-repositório>
cd History
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor:

```bash
npm start
```

4. Acesse no navegador:

```
http://localhost:3000
```

## 🔑 Acesso Administrativo

### Desenvolvimento Local

Para acessar o painel de administração:

1. Na página inicial, pressione **10 vezes a tecla "h"** no canto superior esquerdo
2. Você será redirecionado para a tela de login
3. Use as credenciais padrão:
   - **Usuário:** `admin`
   - **Senha:** `admin123`

### Configuração com Variáveis de Ambiente

Este projeto usa variáveis de ambiente para credenciais. Crie um arquivo `.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=mude-este-secret-por-algo-super-seguro
PORT=3000
NODE_ENV=development
```

> ⚠️ **Importante:**
>
> - Em **produção**, use senhas fortes e secrets aleatórios
> - Nunca commite o arquivo `.env` no Git
> - Para deploy na Vercel, configure as variáveis no painel web

### Gerar SESSION_SECRET Seguro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📖 Como Criar uma História

### 1. Criar a História Base

1. Acesse o painel administrativo
2. Clique em **"Nova História"**
3. Preencha:
   - **Título**: Nome impactante da história
   - **Descrição**: Resumo envolvente (será exibido no card)
   - **Autor**: Seu nome ou pseudônimo
   - **Gênero**: Escolha entre os 8 gêneros disponíveis
   - **Cor da Capa**: Cor que representa a atmosfera da história
   - **Status**: Rascunho (não aparece na página inicial) ou Publicado

### 2. Criar Capítulos

1. Na lista de histórias, clique em **"Capítulos"**
2. Adicione o **primeiro capítulo** (será o ponto de entrada)
3. Escreva de forma literária e envolvente:
   - Use diálogos naturais e cenas detalhadas
   - Crie tensão e conflito
   - Termine com uma situação que demande uma escolha crucial

### 3. Adicionar Escolhas

1. Após criar um capítulo, clique em **"Escolhas"**
2. Adicione no mínimo 2 opções significativas
3. Cada escolha deve:
   - Ter um texto claro e impactante
   - Levar a consequências reais
   - Conectar-se a outro capítulo (ou ser um final)

### 4. Estruturar as Ramificações

```
Capítulo 1: "A Proposta"
  ├─ Escolha A: "Aceitar o dinheiro" → Capítulo 2A
  └─ Escolha B: "Denunciar à polícia" → Capítulo 2B

Capítulo 2A: "O Preço da Ambição"
  ├─ Escolha A: "Continuar no esquema" → Capítulo 3A (Final Ruim)
  └─ Escolha B: "Tentar se redimir" → Capítulo 3B

Capítulo 2B: "Testemunha Protegida"
  ├─ Escolha A: "Confiar no detetive" → Capítulo 3C (Final Bom)
  └─ Escolha B: "Fugir sozinho" → Capítulo 3D
```

### 5. Criar Finais

- Marque capítulos finais com a opção **"Este é um capítulo final"**
- Capítulos finais não devem ter escolhas
- Crie múltiplos finais para aumentar a rejogabilidade
- Cada final deve refletir as consequências das escolhas do leitor

## 🎨 Estrutura do Banco de Dados

### Tabelas

**users**

- `id`, `username`, `password`

**stories**

- `id`, `title`, `description`, `author`, `genre`, `cover_color`, `status`, `created_at`

**chapters**

- `id`, `story_id`, `title`, `content`, `order_num`, `is_ending`, `created_at`

**choices**

- `id`, `chapter_id`, `choice_text`, `next_chapter_id`

**reading_progress**

- `id`, `story_id`, `current_chapter_id`, `session_id`, `updated_at`

## 💡 Dicas de Escrita

### Para Histórias Dramáticas Eficazes:

1. **Base em realidade**: Eventos que poderiam acontecer na vida real
2. **Personagens complexos**: Motivações claras mas moralmente ambíguas
3. **Tensão constante**: Cada cena deve elevar os riscos
4. **Escolhas impossíveis**: Não há opção "certa" óbvia
5. **Consequências reais**: As decisões têm peso e impacto duradouro
6. **Detalhes sensoriais**: Descreva sons, cheiros, sensações físicas
7. **Diálogos autênticos**: Como pessoas reais falariam sob pressão
8. **Ritmo variado**: Alterne entre momentos tensos e de respiro

### Exemplos de Boas Escolhas:

❌ **Ruim**: "Ir para a esquerda" / "Ir para a direita"
✅ **Bom**: "Confrontar seu chefe sobre a fraude" / "Guardar silêncio e proteger sua família"

❌ **Ruim**: "Ser bom" / "Ser mau"
✅ **Bom**: "Usar o dinheiro para salvar seu filho doente" / "Denunciar o crime e confiar no sistema"

## 🎯 Funcionalidades Principais

### Para Leitores:

- Navegação intuitiva entre capítulos
- Sistema de escolhas com botões claros
- Modo Foco para leitura imersiva (esconde UI desnecessária)
- Progresso salvo automaticamente
- Indicador de capítulos finais

### Para Administradores:

- CRUD completo de histórias
- Gerenciamento visual de capítulos
- Editor de escolhas com preview
- Sistema de rascunhos
- Organização por status e gênero

## 📱 Responsividade

O site se adapta perfeitamente a:

- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Telas grandes (1440px+)

## 🔒 Segurança

- Senhas criptografadas com bcrypt (10 rounds)
- Sessões seguras com express-session
- Middleware de autenticação em rotas administrativas
- Validação de dados no servidor
- Proteção contra SQL injection (prepared statements)

## 🎨 Paleta de Cores

- **Deep Charcoal**: `#1a1a1a` - Fundo principal
- **Burnt Orange**: `#d4551f` - Acentos e botões
- **Golden Accent**: `#c9a961` - Destaques importantes
- **Blood Red**: `#8b0000` - Alertas e finais trágicos
- **Ivory**: `#faf8f3` - Texto principal

## 📄 Estrutura de Arquivos

```
History/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── database.db            # Banco de dados SQLite
├── public/
│   └── css/
│       └── style.css      # Estilos dramáticos
└── views/
    ├── index.ejs          # Página inicial
    ├── reader.ejs         # Leitor interativo
    ├── login.ejs          # Login administrativo
    ├── admin.ejs          # Painel admin
    ├── story-form.ejs     # Criar/editar história
    ├── chapters.ejs       # Gerenciar capítulos
    ├── chapter-form.ejs   # Criar/editar capítulo
    └── choices.ejs        # Gerenciar escolhas
```

## 🐛 Solução de Problemas

### Erro "EADDRINUSE"

```bash
# Encontre processos na porta 3000
lsof -i :3000
# Mate o processo
kill -9 <PID>
```

### Banco de dados corrompido

```bash
# Remova o banco e reinicie
rm database.db
npm start
```

### Estilos não carregam

- Verifique se `public/css/style.css` existe
- Limpe o cache do navegador (Ctrl+Shift+R)

## 🚀 Deploy na Vercel

Este projeto está pronto para deploy na Vercel! Veja o guia completo em **[DEPLOY.md](./DEPLOY.md)**.

### Resumo Rápido:

1. **Push para GitHub**
2. **Importe no Vercel** (https://vercel.com/new)
3. **Configure as variáveis de ambiente**:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
4. **Deploy!**

⚠️ **Importante**: SQLite não funciona na Vercel. Você precisará migrar para:

- Vercel Postgres (recomendado)
- Supabase (PostgreSQL grátis)
- PlanetScale (MySQL)
- MongoDB Atlas

Veja instruções completas no **[DEPLOY.md](./DEPLOY.md)**.

## 🚀 Melhorias Futuras

- [ ] Editor WYSIWYG para capítulos
- [ ] Sistema de tags para histórias
- [ ] Estatísticas de leitura (quais escolhas são mais populares)
- [ ] Exportar história para PDF
- [ ] Sistema de comentários
- [ ] Modo escuro/claro
- [ ] Integração com API de IA para sugestões de escrita
- [ ] Sistema de conquistas para leitores

## 📝 Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e distribuir.

## 👤 Autor

Desenvolvido com ☕ e 📚 por [Seu Nome]

---

**Início rápido:**

```bash
npm install && npm start
```

**Acesse:** `http://localhost:3000`  
**Login Admin:** Pressione "h" 10x no canto superior esquerdo → admin/admin123
