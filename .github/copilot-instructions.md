# AI Agent Instructions for History Interactive Stories Platform

## Project Overview

This is a monolithic Node.js/Express application for creating and reading **branching interactive stories** based on dramatic real-life events. Think "Choose Your Own Adventure" meets literary drama with session-based progress tracking.

### Core Architecture

- **Single-file backend**: `server.js` contains all routes, database logic, and middleware (~700 lines)
- **MongoDB Atlas database**: Cloud-hosted MongoDB with Mongoose ODM for data modeling
- **EJS templating**: All views in `/views` with server-side rendering
- **Session-based auth**: Express-session for admin panel (no JWT/tokens)
- **State management**: Reading progress tied to `req.session.id`, not user accounts

### Data Model Flow

```
Story → Chapters → Choices → Next Chapter
         ↓
    Progress tracking (session_id + story_id + current_chapter_id)
```

**Critical**: Chapters form a directed graph via `choices.next_chapter_id` foreign keys. A chapter without choices or with `is_ending=1` terminates a story path.

## Development Workflows

### Running the App

```bash
npm install          # First time only
npm start            # Production mode (port 3000)
npm run dev          # Development with nodemon
```

### Admin Access (Development)

- Go to homepage, press `h` key 10 times (triggers easter egg in `views/index.ejs`)
- Or visit `/secret-admin-login` directly
- Default credentials: `admin` / `admin123` (configurable via `.env`)

### Database Setup

The app connects to MongoDB Atlas on startup and auto-creates collections via Mongoose schemas. The `initDatabase()` function creates the default admin user. No manual migrations needed.

**MongoDB Connection**: Configure `MONGODB_URI` in `.env` file with your Atlas connection string.

## Code Conventions & Patterns

### 1. Route Organization in `server.js`

Routes are grouped by comment blocks in this order:

1. **Public routes** (`/`, `/read/:storyId`)
2. **Auth routes** (`/secret-admin-login`, `/login`, `/logout`)
3. **Admin routes** (all under `/admin/*`, protected by `isAuthenticated` middleware)

When adding routes, maintain this grouping structure.

### 2. Database Query Pattern

Use Mongoose models with async/await for all database operations:

```javascript
// ✅ Correct - Using Mongoose with async/await
const story = await Story.findById(storyId);

// ✅ Correct - Aggregation for complex queries
const stories = await Story.aggregate([
  {
    $lookup: {
      from: "chapters",
      localField: "_id",
      foreignField: "story_id",
      as: "chapters",
    },
  },
  { $addFields: { chapter_count: { $size: "$chapters" } } },
]);

// ❌ Wrong - String interpolation (security risk)
const story = await Story.findOne({ _id: `${storyId}` });
```

All routes use async/await for cleaner error handling. Wrap route handlers in try-catch blocks.

### 3. Session-Based Progress Tracking

Reading progress uses `req.session.id` (not `req.session.userId`). This allows anonymous readers to track progress across stories:

```javascript
const sessionId = req.session.id;
await ReadingProgress.findOneAndUpdate(
  { session_id: sessionId, story_id: storyId },
  { current_chapter_id: chapterId, last_read: new Date() },
  { upsert: true, new: true }
);
```

**Key distinction**: `req.session.userId` exists only after admin login. Regular readers don't have it.

### 4. View Data Passing

EJS views expect specific variable names. Common patterns:

| View File          | Required Variables                                      |
| ------------------ | ------------------------------------------------------- |
| `index.ejs`        | `stories` (array with `chapter_count` from aggregation) |
| `reader.ejs`       | `story`, `chapter`, `choices` (array)                   |
| `admin.ejs`        | `stories`, `username`                                   |
| `chapter-form.ejs` | `story`, `chapter` (or null), `nextNumber`, `username`  |

Always pass these exact names or views will crash.

**MongoDB ObjectId Compatibility**: Views expect an `id` field, but MongoDB uses `_id`. Always add `obj.id = obj._id` when passing Mongoose documents to views.

### 5. Styling Patterns

CSS uses **CSS custom properties** (`:root` variables) in `public/css/style.css`:

- `--deep-charcoal`, `--burnt-orange`, `--golden-accent` for the dramatic color scheme
- `--gradient-warm`, `--gradient-dark` for button/card backgrounds
- `Merriweather` font family (loaded from Google Fonts) for literary feel

When adding UI, prefer these variables over hard-coded colors.

### 6. Forms & POST Handling

All forms use `application/x-www-form-urlencoded` (not JSON). Example:

```html
<form method="POST" action="/admin/story/save">
  <input name="title" value="<%= story?.title || '' %>" />
  <!-- server.js reads: req.body.title -->
</form>
```

Checkbox values: `<input type="checkbox" name="is_ending" <%= chapter?.is_ending ? 'checked' : '' %>>` sends `"on"` if checked, undefined if not. Server checks `req.body.is_ending ? 1 : 0`.

## Common Tasks & Patterns

### Adding a New Story Genre

1. Update the `<select name="genre">` in `views/story-form.ejs`
2. Update the `.story-genre` CSS if special styling needed
3. No database schema change required (genre is a TEXT field)

### Creating a New Admin Route

```javascript
app.get("/admin/my-new-page", isAuthenticated, (req, res) => {
  // Always pass username for header display
  res.render("my-new-view", { username: req.session.username });
});
```

### Handling Chapter Navigation Edge Cases

- **Orphaned chapters**: A choice with `next_chapter_id=null` shows "CAPÍTULO EM DESENVOLVIMENTO" message (see `reader.ejs` else block)
- **Circular references**: Not prevented by schema; avoid in UI by testing story paths
- **Missing first chapter**: Handled by `.sort({ chapter_number: 1 }).limit(1)` in `/read/:storyId`
- **Cascade deletes**: When deleting stories/chapters, manually delete related documents (MongoDB doesn't enforce CASCADE like SQL)

## Environment Configuration

### Required `.env` Variables

```bash
ADMIN_USERNAME=admin              # Admin panel username
ADMIN_PASSWORD=admin123           # Admin panel password (bcrypt hashed on first run)
SESSION_SECRET=random-secret-here # Express session signing key
PORT=3000                         # Server port
NODE_ENV=development              # Controls cookie.secure (set to "production" for HTTPS)
MONGODB_URI=mongodb+srv://...     # MongoDB Atlas connection string
```

**Important**: On first run, the app creates a user with hashed password in MongoDB. Changing `.env` password later won't update existing hash. Delete the user from MongoDB to reset.

## Testing & Debugging

### Manual Testing Checklist

1. **Reader flow**: Create story → Add 3+ chapters with choices → Test all paths end at `is_ending=true` chapters
2. **Session persistence**: Read a story, close browser, reopen → Should resume at last chapter
3. **Admin CRUD**: Create/edit/delete story; verify manual cascade deletes work for chapters/choices
4. **Easter egg**: Press `h` 10 times on homepage → redirects to login
5. **MongoDB connection**: Check console for "📚 Conectado ao MongoDB Atlas" message on startup

### Common Bugs

- **"Cannot read property 'id' of undefined"**: View expects a variable (e.g., `story`) but route didn't pass it
- **Choices not showing**: Check `choices.chapter_id` matches current `chapter.id` and `order_number` is set
- **Progress not saving**: Verify `req.session.save()` is called (express-session auto-saves on response, but explicit call helps)

## Architectural Constraints

### What This Codebase Does NOT Use

- ❌ TypeScript (plain JavaScript)
- ❌ Build tools (Webpack, Vite, etc.)
- ❌ Frontend frameworks (React, Vue)
- ❌ SQL databases (uses MongoDB with Mongoose ODM)
- ❌ User authentication for readers (only session tracking)
- ❌ API endpoints (all routes render HTML)
- ❌ Automated tests (manual testing workflow)

### Deliberate Design Choices

- **Monolithic `server.js`**: Keeps complexity low for small app; refactor only if exceeds ~1000 lines
- **MongoDB Atlas**: Cloud-hosted, serverless-ready, no file persistence issues
- **Mongoose ODM**: Schema validation, easier async/await patterns, but no enforced foreign key constraints
- **EJS over client-side rendering**: SEO-friendly, simpler state management for narrative content
- **Session-based progress**: Allows anonymous reading without forced account creation

## Integration & Dependencies

### Key NPM Packages

- `express-session` (v1.17.3): Configure `cookie.maxAge` to 30 days in `server.js`
- `bcrypt` (v5.1.1): Used only in login flow; 10 rounds (adjust if performance issues)
- `mongoose` (v8.x): ODM for MongoDB, handles schema validation and async queries

### External Services

None currently. All assets self-hosted except:

- Google Fonts CDN for Merriweather font (in `<head>` of views)

## Deployment Considerations

### Localhost to Production Changes

1. Set `NODE_ENV=production` (enables `cookie.secure` for HTTPS)
2. Change default `SESSION_SECRET` (generate via `openssl rand -hex 32`)
3. Set strong `ADMIN_PASSWORD`
4. Whitelist deployment IP in MongoDB Atlas Network Access
5. Set `MONGODB_URI` environment variable in deployment platform (Vercel, Railway, etc.)

### MongoDB Atlas Configuration

- Database is cloud-hosted, no file persistence issues
- Configure IP whitelist in Atlas dashboard (allow 0.0.0.0/0 for serverless)
- Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/`
- Database name is set to `history_interactive` in code

## Writing Style Guidelines

When adding narrative features, maintain the "dramatic real-life events" tone:

- Use present tense for immediacy
- Avoid fantasy/sci-fi tropes
- Focus on moral dilemmas (no "kill the goblin" choices)
- Example good choice: "Confrontar o chefe sobre a fraude" vs "Proteger sua família e ficar em silêncio"

## File Locations Reference

- **Server logic**: `server.js` (MongoDB version)
- **Legacy SQLite version**: `server-sqlite.js` (backup, no longer used)
- **Database**: MongoDB Atlas (cloud-hosted)
- **Mongoose models**: Defined inline in `server.js` (User, Story, Chapter, Choice, ReadingProgress)
- **Views**: `/views/*.ejs`
- **Styles**: `/public/css/style.css`
- **No JS assets**: All interactivity is server-rendered forms
- **Config**: `.env` (not in repo, contains MongoDB credentials)
