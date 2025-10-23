const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mrjociriju_db_user:5BhRGBe2H9x4njC3@cluster0.kuihnel.mongodb.net/?appName=Cluster0';

// Eventos do Mongoose para monitoramento
mongoose.connection.on('connecting', () => {
  console.log('⏳ Mongoose: Conectando ao MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose: Conexão estabelecida com sucesso!');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose: Desconectado do MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose Error:', err);
});

async function connectDatabase() {
  console.log('\n🔄 Tentando conectar ao MongoDB Atlas...\n');

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'history_interactive',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('📚 MongoDB Atlas conectado com sucesso!');
    console.log(`📦 Collections disponíveis serão criadas automaticamente\n`);

    return true;
  } catch (err) {
    console.error('\n❌ ERRO CRÍTICO AO CONECTAR AO MONGODB:');
    console.error('='.repeat(60));
    console.error('Mensagem:', err.message);
    console.error('Código:', err.code);
    console.error('Nome:', err.name);
    console.error('='.repeat(60));
    console.error('\n💡 Possíveis soluções:');
    console.error('1. Verifique se o IP está na whitelist do MongoDB Atlas');
    console.error('2. Verifique se a senha está correta');
    console.error('3. Verifique se o cluster está ativo');
    console.error('4. Tente acessar: https://cloud.mongodb.com/');
    console.error('\n');
    process.exit(1);
  }
}

async function initDatabase() {
  console.log('\n🔧 Inicializando banco de dados...');

  try {
    const User = require('../models/User');
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Collections existentes: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'Nenhuma (será criada automaticamente)'}`);

    console.log(`\n🔍 Verificando usuário admin...`);
    const existingUser = await User.findOne({ username: ADMIN_USERNAME });

    if (!existingUser) {
      console.log('⏳ Criando usuário admin...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        username: ADMIN_USERNAME,
        password: hashedPassword
      });
      console.log('✅ Usuário padrão criado com sucesso!');
      console.log(`   👤 Username: ${ADMIN_USERNAME}`);
      console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log(`✅ Usuário admin já existe (ID: ${existingUser._id})`);
    }

    console.log('\n✅ Banco de dados inicializado com sucesso!\n');
  } catch (err) {
    console.error('\n❌ ERRO ao inicializar banco de dados:');
    console.error('Detalhes:', err.message);
    console.error('Stack:', err.stack);
  }
}

module.exports = { connectDatabase, initDatabase };
