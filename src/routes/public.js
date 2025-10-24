const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const Choice = require('../models/Choice');
const ReadingProgress = require('../models/ReadingProgress');

async function publicRoutes(fastify, options) {
  // Página principal - Grid de histórias
  fastify.get('/', async (request, reply) => {
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

      return reply.view('index', { stories });
    } catch (err) {
      console.error(err);
      return reply.view('index', { stories: [] });
    }
  });

  // Página de leitura interativa
  fastify.get('/read/:storyId', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const sessionId = request.session.sessionId;

      console.log('\n📚 [READ] Carregando capítulo:');
      console.log('   Story ID:', storyId);
      console.log('   Session ID:', sessionId);

      const story = await Story.findById(storyId);
      if (!story) {
        console.log('   ❌ História não encontrada');
        return reply.redirect('/');
      }

      story.id = story._id;

      const progress = await ReadingProgress.findOne({
        session_id: sessionId,
        story_id: storyId
      });

      console.log('   📊 Progresso encontrado:', progress ? {
        current_chapter_id: progress.current_chapter_id,
        last_read: progress.last_read
      } : 'Nenhum progresso');

      let chapter;

      if (progress) {
        chapter = await Chapter.findById(progress.current_chapter_id);
        console.log('   📖 Capítulo do progresso:', chapter ? `${chapter.chapter_number} - ${chapter.title}` : 'Não encontrado');
      }

      if (!chapter) {
        chapter = await Chapter.findOne({ story_id: storyId }).sort({ chapter_number: 1 });
        console.log('   📖 Primeiro capítulo:', chapter ? `${chapter.chapter_number} - ${chapter.title}` : 'Não encontrado');

        if (!chapter) {
          return reply.send('Esta história ainda não tem capítulos.');
        }
      }

      chapter.id = chapter._id;

      const choices = await Choice.find({ chapter_id: chapter._id }).sort({ order_number: 1 });
      console.log('   🔀 Escolhas encontradas:', choices.length);
      choices.forEach((choice, idx) => {
        console.log(`      ${idx + 1}. "${choice.choice_text}" → Chapter ID: ${choice.next_chapter_id}`);
      });

      await ReadingProgress.findOneAndUpdate(
        { session_id: sessionId, story_id: story._id },
        {
          current_chapter_id: chapter._id,
          last_read: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('   ✅ Renderizando reader.ejs\n');

      return reply.view('reader', { story, chapter, choices });
    } catch (err) {
      console.error('   ❌ Erro:', err);
      return reply.redirect('/');
    }
  });

  // Navegar para próximo capítulo (escolha)
  fastify.post('/read/:storyId/choice', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const nextChapterId = request.body.nextChapterId;
      const sessionId = request.session.sessionId;

      console.log('\n📖 [CHOICE] Processando escolha:');
      console.log('   Story ID:', storyId);
      console.log('   Next Chapter ID:', nextChapterId);
      console.log('   Session ID:', sessionId);
      console.log('   Body completo:', request.body);

      if (!nextChapterId) {
        console.log('   ⚠️ Next Chapter ID está vazio, redirecionando...');
        return reply.redirect(`/read/${storyId}`);
      }

      const result = await ReadingProgress.findOneAndUpdate(
        { session_id: sessionId, story_id: storyId },
        {
          current_chapter_id: nextChapterId,
          last_read: new Date()
        },
        { upsert: true, new: true }
      );

      console.log('   ✅ Progresso atualizado:', result);
      console.log('   ↪️  Redirecionando para /read/' + storyId + '\n');

      return reply.redirect(`/read/${storyId}`);
    } catch (err) {
      console.error('   ❌ Erro ao processar escolha:', err);
      return reply.redirect(`/read/${request.params.storyId}`);
    }
  });

  // Resetar progresso de leitura
  fastify.post('/read/:storyId/restart', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const sessionId = request.session.sessionId;

      await ReadingProgress.deleteOne({
        session_id: sessionId,
        story_id: storyId
      });

      return reply.redirect(`/read/${storyId}`);
    } catch (err) {
      console.error(err);
      return reply.redirect(`/read/${request.params.storyId}`);
    }
  });
}

module.exports = publicRoutes;
