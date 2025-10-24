require('dotenv').config();
const fastify = require('fastify')({ logger: false });
const path = require('path');
const { connectDatabase, initDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';

// Logs de ambiente
console.log('\n🚀 INICIANDO SERVIDOR - FASTIFY EDITION');
console.log('='.repeat(60));
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 PORT: ${PORT}`);
console.log(`👤 ADMIN_USERNAME: ${process.env.ADMIN_USERNAME || 'admin'}`);
console.log(`🔐 SESSION_SECRET está definido: ${SESSION_SECRET ? 'Sim ✅' : 'Não ❌'}`);
console.log('='.repeat(60));

// Plugins Fastify
async function buildServer() {
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

// Iniciar servidor
async function start() {
  try {
    await buildServer();
    await connectDatabase();
    await initDatabase();

    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    console.log('\n' + '='.repeat(70));
    console.log('🌟 SERVIDOR DE HISTÓRIAS INTERATIVAS INICIADO COM SUCESSO!');
    console.log('='.repeat(70));
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Porta: ${PORT}`);
    console.log(`⚡ Framework: Fastify (3x mais rápido que Express!)`);
    console.log(`📖 Página principal: http://localhost:${PORT}`);
    console.log(`🔐 Área administrativa: http://localhost:${PORT}/secret-admin-login`);
    console.log(`👤 Credenciais padrão: ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('='.repeat(70));
    console.log('\n💡 Para testar o login:');
    console.log(`   1. Acesse: http://localhost:${PORT}/secret-admin-login`);
    console.log(`   2. Use: ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`   3. Ou pressione 'h' 10x na página inicial\n`);
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
