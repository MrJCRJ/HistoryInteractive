require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de ambiente
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mrjociriju_db_user:5BhRGBe2H9x4njC3@cluster0.kuihnel.mongodb.net/?appName=Cluster0';

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI, {
  dbName: 'history_interactive'
})
  .then(() => {
    console.log('📚 Conectado ao MongoDB Atlas');
    initDatabase();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// ============================================
// SCHEMAS E MODELS DO MONGOOSE
// ============================================

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  cover_color: { type: String, default: '#2d2d2d' },
  cover_image: String,
  genre: { type: String, default: 'Drama Real' },
  status: { type: String, default: 'Em andamento' },
  date_created: { type: Date, default: Date.now },
  date_updated: { type: Date, default: Date.now }
});

const ChapterSchema = new mongoose.Schema({
  story_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
  chapter_number: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  is_ending: { type: Boolean, default: false },
  date_created: { type: Date, default: Date.now }
});

const ChoiceSchema = new mongoose.Schema({
  chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  choice_text: { type: String, required: true },
  next_chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  order_number: { type: Number, default: 0 }
});

const ReadingProgressSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  story_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
  current_chapter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  last_read: { type: Date, default: Date.now }
});

// Índices únicos
ReadingProgressSchema.index({ session_id: 1, story_id: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Story = mongoose.model('Story', StorySchema);
const Chapter = mongoose.model('Chapter', ChapterSchema);
const Choice = mongoose.model('Choice', ChoiceSchema);
const ReadingProgress = mongoose.model('ReadingProgress', ReadingProgressSchema);

// Inicializar banco de dados
async function initDatabase() {
  try {
    // Criar usuário padrão se não existir
    const existingUser = await User.findOne({ username: ADMIN_USERNAME });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        username: ADMIN_USERNAME,
        password: hashedPassword
      });
      console.log('✅ Usuário padrão criado!');
      console.log(`   👤 Username: ${ADMIN_USERNAME}`);
      console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('✅ Usuário admin já existe');
    }
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  }
}

// Middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Middleware de autenticação
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/secret-admin-login');
  }
}

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Página principal - Grid de histórias
app.get('/', async (req, res) => {
  try {
    const stories = await Story.aggregate([
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'story_id',
          as: 'chapters'
        }
      },
      {
        $addFields: {
          chapter_count: { $size: '$chapters' },
          id: '$_id'
        }
      },
      {
        $project: {
          chapters: 0
        }
      },
      {
        $sort: { date_created: -1 }
      }
    ]);

    res.render('index', { stories });
  } catch (err) {
    console.error(err);
    res.render('index', { stories: [] });
  }
});

// Página de leitura interativa
app.get('/read/:storyId', async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const sessionId = req.session.id;

    // Buscar a história
    const story = await Story.findById(storyId);
    if (!story) {
      return res.redirect('/');
    }

    // Adicionar campo id para compatibilidade com views
    story.id = story._id;

    // Verificar progresso de leitura
    const progress = await ReadingProgress.findOne({
      session_id: sessionId,
      story_id: storyId
    });

    let chapter;

    if (progress) {
      chapter = await Chapter.findById(progress.current_chapter_id);
    }

    // Se não tem progresso, pegar o primeiro capítulo
    if (!chapter) {
      chapter = await Chapter.findOne({ story_id: storyId }).sort({ chapter_number: 1 });

      if (!chapter) {
        return res.send('Esta história ainda não tem capítulos.');
      }
    }

    // Adicionar campo id para compatibilidade
    chapter.id = chapter._id;

    await loadChapterView(res, story, chapter, sessionId);
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Função auxiliar para carregar a view do capítulo
async function loadChapterView(res, story, chapter, sessionId) {
  try {
    // Buscar as escolhas do capítulo
    const choices = await Choice.find({ chapter_id: chapter._id }).sort({ order_number: 1 });

    res.render('reader', {
      story,
      chapter,
      choices
    });

    // Atualizar progresso de leitura
    await ReadingProgress.findOneAndUpdate(
      { session_id: sessionId, story_id: story._id },
      {
        current_chapter_id: chapter._id,
        last_read: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Erro ao carregar capítulo:', err);
  }
}

// Navegar para próximo capítulo (escolha)
app.post('/read/:storyId/choice', async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const nextChapterId = req.body.nextChapterId;
    const sessionId = req.session.id;

    if (!nextChapterId) {
      return res.redirect(`/read/${storyId}`);
    }

    // Atualizar progresso
    await ReadingProgress.findOneAndUpdate(
      { session_id: sessionId, story_id: storyId },
      {
        current_chapter_id: nextChapterId,
        last_read: new Date()
      },
      { upsert: true, new: true }
    );

    res.redirect(`/read/${storyId}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/read/${req.params.storyId}`);
  }
});

// Resetar progresso de leitura
app.post('/read/:storyId/restart', async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const sessionId = req.session.id;

    await ReadingProgress.deleteOne({
      session_id: sessionId,
      story_id: storyId
    });

    res.redirect(`/read/${storyId}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/read/${req.params.storyId}`);
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

app.get('/secret-admin-login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin');
  }
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`[LOGIN] Tentativa de login - Username: ${username}`);

    const user = await User.findOne({ username });

    if (!user) {
      console.log(`[LOGIN] Usuário não encontrado: ${username}`);
      return res.render('login', { error: 'Usuário ou senha inválidos' });
    }

    console.log(`[LOGIN] Usuário encontrado, verificando senha...`);

    const result = await bcrypt.compare(password, user.password);

    if (result) {
      console.log(`[LOGIN] ✅ Login bem-sucedido para: ${username}`);
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      res.redirect('/admin');
    } else {
      console.log(`[LOGIN] ❌ Senha incorreta para: ${username}`);
      res.render('login', { error: 'Usuário ou senha inválidos' });
    }
  } catch (err) {
    console.error('[LOGIN] Erro:', err);
    res.render('login', { error: 'Erro ao processar login' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// Painel principal
app.get('/admin', isAuthenticated, async (req, res) => {
  try {
    const stories = await Story.aggregate([
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'story_id',
          as: 'chapters'
        }
      },
      {
        $addFields: {
          chapter_count: { $size: '$chapters' },
          id: '$_id'
        }
      },
      {
        $project: {
          chapters: 0
        }
      },
      {
        $sort: { date_created: -1 }
      }
    ]);

    res.render('admin', { stories, username: req.session.username });
  } catch (err) {
    console.error(err);
    res.render('admin', { stories: [], username: req.session.username });
  }
});

// Formulário de nova história
app.get('/admin/story/new', isAuthenticated, (req, res) => {
  res.render('story-form', { story: null, username: req.session.username });
});

// Formulário de editar história
app.get('/admin/story/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.redirect('/admin');
    }
    story.id = story._id;
    res.render('story-form', { story, username: req.session.username });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Salvar história
app.post('/admin/story/save', isAuthenticated, async (req, res) => {
  try {
    const { id, title, description, cover_color, genre, status } = req.body;

    if (id) {
      // Atualizar
      await Story.findByIdAndUpdate(id, {
        title,
        description,
        cover_color: cover_color || '#2d2d2d',
        genre,
        status,
        date_updated: new Date()
      });
      res.redirect('/admin/story/' + id + '/chapters');
    } else {
      // Criar nova
      const newStory = await Story.create({
        title,
        description,
        cover_color: cover_color || '#2d2d2d',
        genre,
        status
      });
      res.redirect('/admin/story/' + newStory._id + '/chapters');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Excluir história
app.post('/admin/story/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;

    // Buscar todos os capítulos da história
    const chapters = await Chapter.find({ story_id: storyId });
    const chapterIds = chapters.map(c => c._id);

    // Deletar todas as escolhas relacionadas aos capítulos
    await Choice.deleteMany({ chapter_id: { $in: chapterIds } });

    // Deletar todos os capítulos
    await Chapter.deleteMany({ story_id: storyId });

    // Deletar progresso de leitura
    await ReadingProgress.deleteMany({ story_id: storyId });

    // Deletar a história
    await Story.findByIdAndDelete(storyId);

    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Gerenciar capítulos
app.get('/admin/story/:storyId/chapters', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.redirect('/admin');
    }

    story.id = story._id;

    const chapters = await Chapter.find({ story_id: storyId }).sort({ chapter_number: 1 });

    // Adicionar campo id para cada capítulo
    const chaptersWithId = chapters.map(ch => {
      const chObj = ch.toObject();
      chObj.id = ch._id;
      return chObj;
    });

    res.render('chapters', { story, chapters: chaptersWithId, username: req.session.username });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Formulário de novo capítulo
app.get('/admin/story/:storyId/chapter/new', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.redirect('/admin');
    }

    story.id = story._id;

    // Buscar próximo número de capítulo
    const lastChapter = await Chapter.findOne({ story_id: storyId }).sort({ chapter_number: -1 });
    const nextNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;

    res.render('chapter-form', {
      story,
      chapter: null,
      nextNumber,
      username: req.session.username
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Formulário de editar capítulo
app.get('/admin/story/:storyId/chapter/edit/:chapterId', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const chapterId = req.params.chapterId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.redirect('/admin');
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.redirect('/admin/story/' + storyId + '/chapters');
    }

    story.id = story._id;
    chapter.id = chapter._id;

    res.render('chapter-form', {
      story,
      chapter,
      nextNumber: chapter.chapter_number,
      username: req.session.username
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Salvar capítulo
app.post('/admin/story/:storyId/chapter/save', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const { id, chapter_number, title, content, is_ending } = req.body;

    if (id) {
      // Atualizar
      await Chapter.findByIdAndUpdate(id, {
        chapter_number,
        title,
        content,
        is_ending: is_ending ? true : false
      });
      res.redirect('/admin/story/' + storyId + '/chapter/' + id + '/choices');
    } else {
      // Criar
      const newChapter = await Chapter.create({
        story_id: storyId,
        chapter_number,
        title,
        content,
        is_ending: is_ending ? true : false
      });
      res.redirect('/admin/story/' + storyId + '/chapter/' + newChapter._id + '/choices');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/admin/story/' + req.params.storyId + '/chapters');
  }
});

// Excluir capítulo
app.post('/admin/story/:storyId/chapter/delete/:chapterId', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const chapterId = req.params.chapterId;

    // Deletar escolhas relacionadas
    await Choice.deleteMany({ chapter_id: chapterId });

    // Deletar referências em outras escolhas
    await Choice.updateMany(
      { next_chapter_id: chapterId },
      { $unset: { next_chapter_id: "" } }
    );

    // Deletar o capítulo
    await Chapter.findByIdAndDelete(chapterId);

    res.redirect('/admin/story/' + storyId + '/chapters');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/story/' + req.params.storyId + '/chapters');
  }
});

// Gerenciar escolhas de um capítulo
app.get('/admin/story/:storyId/chapter/:chapterId/choices', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const chapterId = req.params.chapterId;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.redirect('/admin');
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.redirect('/admin/story/' + storyId + '/chapters');
    }

    const choices = await Choice.find({ chapter_id: chapterId }).sort({ order_number: 1 });
    const allChapters = await Chapter.find({ story_id: storyId }).sort({ chapter_number: 1 });

    // Adicionar campo id
    story.id = story._id;
    chapter.id = chapter._id;

    const choicesWithId = choices.map(ch => {
      const chObj = ch.toObject();
      chObj.id = ch._id;
      return chObj;
    });

    const allChaptersWithId = allChapters.map(ch => {
      const chObj = ch.toObject();
      chObj.id = ch._id;
      return chObj;
    });

    res.render('choices', {
      story,
      chapter,
      choices: choicesWithId,
      allChapters: allChaptersWithId,
      username: req.session.username
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

// Adicionar escolha
app.post('/admin/story/:storyId/chapter/:chapterId/choice/add', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const chapterId = req.params.chapterId;
    const { choice_text, next_chapter_id, order_number } = req.body;

    await Choice.create({
      chapter_id: chapterId,
      choice_text,
      next_chapter_id: next_chapter_id || null,
      order_number: order_number || 0
    });

    res.redirect('/admin/story/' + storyId + '/chapter/' + chapterId + '/choices');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/story/' + req.params.storyId + '/chapter/' + req.params.chapterId + '/choices');
  }
});

// Excluir escolha
app.post('/admin/story/:storyId/chapter/:chapterId/choice/delete/:choiceId', isAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const chapterId = req.params.chapterId;
    const choiceId = req.params.choiceId;

    await Choice.findByIdAndDelete(choiceId);

    res.redirect('/admin/story/' + storyId + '/chapter/' + chapterId + '/choices');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/story/' + req.params.storyId + '/chapter/' + req.params.chapterId + '/choices');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🌟 Servidor de Histórias Interativas rodando!`);
  console.log(`📖 Página principal: http://localhost:${PORT}`);
  console.log(`🔐 Área administrativa: http://localhost:${PORT}/secret-admin-login`);
  console.log(`👤 Credenciais: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}\n`);
});
