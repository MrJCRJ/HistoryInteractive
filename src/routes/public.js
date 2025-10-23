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

      const story = await Story.findById(storyId);
      if (!story) {
        return reply.redirect('/');
      }

      story.id = story._id;

      const progress = await ReadingProgress.findOne({
        session_id: sessionId,
        story_id: storyId
      });

      let chapter;

      if (progress) {
        chapter = await Chapter.findById(progress.current_chapter_id);
      }

      if (!chapter) {
        chapter = await Chapter.findOne({ story_id: storyId }).sort({ chapter_number: 1 });

        if (!chapter) {
          return reply.send('Esta história ainda não tem capítulos.');
        }
      }

      chapter.id = chapter._id;

      const choices = await Choice.find({ chapter_id: chapter._id }).sort({ order_number: 1 });

      await ReadingProgress.findOneAndUpdate(
        { session_id: sessionId, story_id: story._id },
        {
          current_chapter_id: chapter._id,
          last_read: new Date()
        },
        { upsert: true, new: true }
      );

      return reply.view('reader', { story, chapter, choices });
    } catch (err) {
      console.error(err);
      return reply.redirect('/');
    }
  });

  // Navegar para próximo capítulo (escolha)
  fastify.post('/read/:storyId/choice', async (request, reply) => {
    try {
      const storyId = request.params.storyId;
      const nextChapterId = request.body.nextChapterId;
      const sessionId = request.session.sessionId;

      if (!nextChapterId) {
        return reply.redirect(`/read/${storyId}`);
      }

      await ReadingProgress.findOneAndUpdate(
        { session_id: sessionId, story_id: storyId },
        {
          current_chapter_id: nextChapterId,
          last_read: new Date()
        },
        { upsert: true, new: true }
      );

      return reply.redirect(`/read/${storyId}`);
    } catch (err) {
      console.error(err);
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
