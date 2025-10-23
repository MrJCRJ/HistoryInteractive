const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const Choice = require('../models/Choice');
const ReadingProgress = require('../models/ReadingProgress');
const { isAuthenticated } = require('../middleware/auth');

async function adminRoutes(fastify, options) {
  // Aplicar middleware de autenticação em todas as rotas
  fastify.addHook('onRequest', isAuthenticated);

  // Painel principal
  fastify.get('/admin', async (request, reply) => {
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

      return reply.view('admin', { stories, username: request.session.username });
    } catch (err) {
      console.error(err);
      return reply.view('admin', { stories: [], username: request.session.username });
    }
  });

  // Formulário de nova história
  fastify.get('/admin/story/new', async (request, reply) => {
    return reply.view('story-form', { story: null, username: request.session.username });
  });

  // Formulário de editar história
  fastify.get('/admin/story/edit/:id', async (request, reply) => {
    try {
      const story = await Story.findById(request.params.id);
      if (!story) {
        return reply.redirect('/admin');
      }
      story.id = story._id;
      return reply.view('story-form', { story, username: request.session.username });
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Salvar história
  fastify.post('/admin/story/save', async (request, reply) => {
    try {
      const { id, title, description, cover_color, genre, status } = request.body;

      if (id) {
        await Story.findByIdAndUpdate(id, {
          title,
          description,
          cover_color: cover_color || '#2d2d2d',
          genre,
          status,
          date_updated: new Date()
        });
        return reply.redirect('/admin/story/' + id + '/chapters');
      } else {
        const newStory = await Story.create({
          title,
          description,
          cover_color: cover_color || '#2d2d2d',
          genre,
          status
        });
        return reply.redirect('/admin/story/' + newStory._id + '/chapters');
      }
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Excluir história
  fastify.post('/admin/story/delete/:id', async (request, reply) => {
    try {
      const storyId = request.params.id;

      const chapters = await Chapter.find({ story_id: storyId });
      const chapterIds = chapters.map(c => c._id);

      await Choice.deleteMany({ chapter_id: { $in: chapterIds } });
      await Chapter.deleteMany({ story_id: storyId });
      await ReadingProgress.deleteMany({ story_id: storyId });
      await Story.findByIdAndDelete(storyId);

      return reply.redirect('/admin');
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Gerenciar capítulos
  fastify.get('/admin/story/:storyId/chapters', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const story = await Story.findById(storyId);

      if (!story) {
        return reply.redirect('/admin');
      }

      story.id = story._id;

      const chapters = await Chapter.find({ story_id: storyId }).sort({ chapter_number: 1 });
      const allChoices = await Choice.find({}).sort({ order_number: 1 });

      const chaptersWithId = chapters.map(ch => {
        const chObj = ch.toObject();
        chObj.id = ch._id;
        // Adicionar escolhas do capítulo
        chObj.choices = allChoices.filter(choice => String(choice.chapter_id) === String(ch._id));
        return chObj;
      });

      return reply.view('chapters', { story, chapters: chaptersWithId, username: request.session.username });
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Formulário de novo capítulo (VERSÃO MELHORADA)
  fastify.get('/admin/story/:storyId/chapter/new', async (request, reply) => {
    try {
      const story = await Story.findById(request.params.storyId);
      if (!story) {
        return reply.code(404).send('História não encontrada');
      }
      story.id = story._id;

      // Buscar próximo número de capítulo
      const lastChapter = await Chapter.findOne({ story_id: story._id })
        .sort({ chapter_number: -1 })
        .limit(1);
      const nextNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;

      return reply.view('chapter-form-enhanced', {
        story,
        chapter: null,
        nextNumber,
        username: request.session.username
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send('Erro ao carregar formulário');
    }
  });

  // Formulário de novo capítulo VINCULADO A UMA ESCOLHA
  fastify.get('/admin/story/:storyId/chapter/new-from-choice/:choiceId', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const choiceId = request.params.choiceId;

      const story = await Story.findById(storyId);
      if (!story) {
        return reply.code(404).send('História não encontrada');
      }
      story.id = story._id;

      const choice = await Choice.findById(choiceId);
      if (!choice) {
        return reply.code(404).send('Escolha não encontrada');
      }

      // Buscar o capítulo de origem (onde a escolha está)
      const sourceChapter = await Chapter.findById(choice.chapter_id);

      // Buscar próximo número de capítulo
      const lastChapter = await Chapter.findOne({ story_id: story._id })
        .sort({ chapter_number: -1 })
        .limit(1);
      const nextNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;

      return reply.view('chapter-form-enhanced', {
        story,
        chapter: null,
        nextNumber,
        choiceId: choiceId, // Passa o ID da escolha para vincular automaticamente
        choiceText: choice.choice_text,
        sourceChapter: sourceChapter,
        username: request.session.username
      });
    } catch (err) {
      console.error(err);
      return reply.code(500).send('Erro ao carregar formulário');
    }
  });

  // Formulário de editar capítulo
  fastify.get('/admin/story/:storyId/chapter/edit/:chapterId', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const chapterId = request.params.chapterId;

      const story = await Story.findById(storyId);
      if (!story) {
        return reply.redirect('/admin');
      }

      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return reply.redirect('/admin/story/' + storyId + '/chapters');
      }

      story.id = story._id;
      chapter.id = chapter._id;

      return reply.view('chapter-form', {
        story,
        chapter,
        nextNumber: chapter.chapter_number,
        username: request.session.username
      });
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Salvar capítulo COM ESCOLHAS (NOVO ENDPOINT)
  fastify.post('/admin/story/:storyId/chapter/save-with-choices', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const { id, chapter_number, title, content, is_ending, choices, choiceId } = request.body;

      // 1. Salvar/atualizar o capítulo principal
      let chapterId;
      if (id) {
        await Chapter.findByIdAndUpdate(id, {
          chapter_number,
          title,
          content,
          is_ending: is_ending ? true : false
        });
        chapterId = id;
      } else {
        const newChapter = new Chapter({
          story_id: storyId,
          chapter_number,
          title,
          content,
          is_ending: is_ending ? true : false
        });
        const savedChapter = await newChapter.save();
        chapterId = savedChapter._id;
      }

      // 2. Se veio de uma escolha específica, vincular automaticamente
      if (choiceId) {
        await Choice.findByIdAndUpdate(choiceId, {
          next_chapter_id: chapterId
        });
        console.log(`✅ Escolha ${choiceId} vinculada ao capítulo ${chapterId}`);
      }

      // 3. Se não for capítulo final e tiver escolhas, processar
      if (!is_ending && choices) {
        // Limpar escolhas antigas se estiver editando (mas não a escolha de origem)
        if (!choiceId) {
          await Choice.deleteMany({ chapter_id: chapterId });
        }

        // Processar cada escolha
        for (const [key, choiceData] of Object.entries(choices)) {
          if (!choiceData.text || choiceData.text.trim() === '') continue;

          let nextChapterId = null;

          // Se tiver conteúdo para próximo capítulo, criar automaticamente
          if (choiceData.next_content && choiceData.next_content.trim() !== '') {
            const nextChapterNumber = parseInt(chapter_number) + 1;
            const nextChapter = new Chapter({
              story_id: storyId,
              chapter_number: nextChapterNumber,
              title: `${title} - ${choiceData.text.substring(0, 30)}...`,
              content: choiceData.next_content,
              is_ending: false
            });
            const savedNextChapter = await nextChapter.save();
            nextChapterId = savedNextChapter._id;
          }

          // Criar a escolha
          const newChoice = new Choice({
            chapter_id: chapterId,
            choice_text: choiceData.text,
            next_chapter_id: nextChapterId,
            order_number: parseInt(choiceData.order) || parseInt(key)
          });
          await newChoice.save();
        }
      }

      // 4. Redirecionar de volta aos capítulos
      return reply.redirect('/admin/story/' + storyId + '/chapters');
    } catch (err) {
      console.error('❌ Erro ao salvar capítulo com escolhas:', err);
      return reply.code(500).send('Erro ao salvar: ' + err.message);
    }
  });

  // Salvar capítulo (ROTA ANTIGA - manter para compatibilidade)
  fastify.post('/admin/story/:storyId/chapter/save', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const { id, chapter_number, title, content, is_ending } = request.body;

      if (id) {
        await Chapter.findByIdAndUpdate(id, {
          chapter_number,
          title,
          content,
          is_ending: is_ending ? true : false
        });
        return reply.redirect('/admin/story/' + storyId + '/chapter/' + id + '/choices');
      } else {
        const newChapter = await Chapter.create({
          story_id: storyId,
          chapter_number,
          title,
          content,
          is_ending: is_ending ? true : false
        });
        return reply.redirect('/admin/story/' + storyId + '/chapter/' + newChapter._id + '/choices');
      }
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin/story/' + request.params.storyId + '/chapters');
    }
  });

  // Excluir capítulo
  fastify.post('/admin/story/:storyId/chapter/delete/:chapterId', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const chapterId = request.params.chapterId;

      await Choice.deleteMany({ chapter_id: chapterId });
      await Choice.updateMany(
        { next_chapter_id: chapterId },
        { $unset: { next_chapter_id: "" } }
      );
      await Chapter.findByIdAndDelete(chapterId);

      return reply.redirect('/admin/story/' + storyId + '/chapters');
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin/story/' + request.params.storyId + '/chapters');
    }
  });

  // Gerenciar escolhas de um capítulo
  fastify.get('/admin/story/:storyId/chapter/:chapterId/choices', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const chapterId = request.params.chapterId;

      const story = await Story.findById(storyId);
      if (!story) {
        return reply.redirect('/admin');
      }

      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return reply.redirect('/admin/story/' + storyId + '/chapters');
      }

      const choices = await Choice.find({ chapter_id: chapterId }).sort({ order_number: 1 });
      const allChapters = await Chapter.find({ story_id: storyId }).sort({ chapter_number: 1 });

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

      return reply.view('choices', {
        story,
        chapter,
        choices: choicesWithId,
        allChapters: allChaptersWithId,
        username: request.session.username
      });
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin');
    }
  });

  // Adicionar escolha
  fastify.post('/admin/story/:storyId/chapter/:chapterId/choice/add', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const chapterId = request.params.chapterId;
      const { choice_text, next_chapter_id, order_number } = request.body;

      await Choice.create({
        chapter_id: chapterId,
        choice_text,
        next_chapter_id: next_chapter_id || null,
        order_number: order_number || 0
      });

      return reply.redirect('/admin/story/' + storyId + '/chapter/' + chapterId + '/choices');
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin/story/' + request.params.storyId + '/chapter/' + request.params.chapterId + '/choices');
    }
  });

  // Excluir escolha
  fastify.post('/admin/story/:storyId/chapter/:chapterId/choice/delete/:choiceId', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const chapterId = request.params.chapterId;
      const choiceId = request.params.choiceId;

      await Choice.findByIdAndDelete(choiceId);

      return reply.redirect('/admin/story/' + storyId + '/chapter/' + chapterId + '/choices');
    } catch (err) {
      console.error(err);
      return reply.redirect('/admin/story/' + request.params.storyId + '/chapter/' + request.params.chapterId + '/choices');
    }
  });
}

module.exports = adminRoutes;
