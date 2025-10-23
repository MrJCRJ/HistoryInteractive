const bcrypt = require('bcrypt');
const User = require('../models/User');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

async function authRoutes(fastify, options) {
  // Página de login
  fastify.get('/secret-admin-login', async (request, reply) => {
    if (request.session.userId) {
      return reply.redirect('/admin');
    }
    return reply.view('login', { error: null });
  });

  // Processar login
  fastify.post('/login', async (request, reply) => {
    const timestamp = new Date().toISOString();

    try {
      const { username, password } = request.body;

      console.log(`\n[${timestamp}] 🔐 LOGIN - Nova tentativa`);
      console.log(`   👤 Username fornecido: "${username}"`);
      console.log(`   🔑 Senha fornecida: ${password ? '***' + password.slice(-2) : 'vazia'}`);
      console.log(`   📍 IP: ${request.ip}`);

      if (!username || !password) {
        console.log(`[LOGIN] ❌ Credenciais vazias`);
        return reply.view('login', { error: 'Por favor, preencha usuário e senha' });
      }

      console.log(`[LOGIN] 🔍 Buscando usuário no MongoDB...`);
      const user = await User.findOne({ username });

      if (!user) {
        console.log(`[LOGIN] ❌ Usuário não encontrado: "${username}"`);
        return reply.view('login', { error: 'Usuário ou senha inválidos' });
      }

      console.log(`[LOGIN] ✅ Usuário encontrado no banco`);
      console.log(`   📝 ID: ${user._id}`);

      console.log(`[LOGIN] 🔓 Comparando senhas com bcrypt...`);
      const result = await bcrypt.compare(password, user.password);

      if (result) {
        console.log(`[LOGIN] ✅✅✅ Login bem-sucedido para: ${username}`);
        console.log(`[LOGIN] 🎫 Criando sessão...`);
        request.session.userId = user._id.toString();
        request.session.username = user.username;
        console.log(`[LOGIN] ↪️  Redirecionando para /admin\n`);
        return reply.redirect('/admin');
      } else {
        console.log(`[LOGIN] ❌ Senha incorreta para: ${username}\n`);
        return reply.view('login', { error: 'Usuário ou senha inválidos' });
      }
    } catch (err) {
      console.error(`\n[${timestamp}] ❌ ERRO CRÍTICO NO LOGIN:`);
      console.error('   Mensagem:', err.message);
      console.error('   Stack:', err.stack);
      console.error('');
      return reply.view('login', { error: 'Erro ao processar login. Verifique os logs do servidor.' });
    }
  });

  // Logout
  fastify.get('/logout', async (request, reply) => {
    request.session.destroy();
    return reply.redirect('/');
  });
}

module.exports = authRoutes;
