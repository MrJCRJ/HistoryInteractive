/**
 * Entry point for Vercel deployment (Serverless)
 * Vercel requires a handler function, not a listening server
 */

require('dotenv').config();
const path = require('path');
const { connectDatabase, initDatabase } = require('./src/config/database');

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';

let app;
let isInitialized = false;

// Build Fastify app (executa apenas uma vez)
async function buildApp() {
  const fastify = require('fastify')({ logger: false });

  // View engine (EJS)
  await fastify.register(require('@fastify/view'), {
    engine: {
      ejs: require('ejs')
    },
    root: path.join(__dirname, 'views')
  });

  // Arquivos estáticos
  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
  });

  // Form body parser
  await fastify.register(require('@fastify/formbody'));

  // Cookie support
  await fastify.register(require('@fastify/cookie'));

  // Session
  await fastify.register(require('@fastify/session'), {
    secret: SESSION_SECRET,
    cookie: {
      secure: 'auto', // Detecta automaticamente HTTP/HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      sameSite: 'lax',
      path: '/'
    },
    saveUninitialized: true,
    rolling: true // Renova o cookie a cada request
  });

  // Middleware de logging
  fastify.addHook('onRequest', async (request, reply) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method} ${request.url} - IP: ${request.ip}`);
  });

  // Registrar rotas
  await fastify.register(require('./src/routes/public'));
  await fastify.register(require('./src/routes/auth'));
  await fastify.register(require('./src/routes/admin'));

  // Tratamento de erro 404
  fastify.setNotFoundHandler((request, reply) => {
    console.log(`❌ 404 - Rota não encontrada: ${request.method} ${request.url}`);
    reply.code(404).type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>404 - Página não encontrada</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1>❌ Página não encontrada</h1>
          <p>A rota <code>${request.url}</code> não existe.</p>
          <a href="/">← Voltar para página inicial</a>
        </body>
      </html>
    `);
  });

  // Tratamento de erro global
  fastify.setErrorHandler((error, request, reply) => {
    const timestamp = new Date().toISOString();
    console.error(`\n[${timestamp}] ❌ ERRO NO SERVIDOR:`);
    console.error('URL:', request.method, request.url);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    reply.code(500).type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>500 - Erro no Servidor</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h1>⚠️ Erro no Servidor</h1>
          <p>Ocorreu um erro ao processar sua requisição.</p>
          <p><small>${process.env.NODE_ENV === 'development' ? error.message : 'Verifique os logs do servidor'}</small></p>
          <a href="/">← Voltar para página inicial</a>
        </body>
      </html>
    `);
  });

  return fastify;
}

// Para Vercel serverless
module.exports = async (req, res) => {
  try {
    // Inicializar app apenas uma vez
    if (!app) {
      console.log('🔧 Inicializando aplicação Fastify para Vercel...');
      app = await buildApp();
      await app.ready();
      console.log('✅ Fastify pronto!');
    }

    // Conectar ao banco apenas uma vez
    if (!isInitialized) {
      console.log('🔧 Conectando ao MongoDB...');
      await connectDatabase();
      await initDatabase();
      isInitialized = true;
      console.log('✅ MongoDB conectado!');
    }

    // Processar requisição
    app.routing(req, res);
  } catch (error) {
    console.error('❌ Erro no handler Vercel:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: 'Erro interno do servidor',
      message: error.message
    }));
  }
};
