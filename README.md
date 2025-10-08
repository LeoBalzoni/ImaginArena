# ImaginArena 🎨⚔️

A real-time tournament-based image generation competition platform where creativity meets competition! Players join tournaments, receive creative prompts, submit AI-generated images, and vote for their favorites in an exciting single-elimination bracket system.

## 🚀 Features

- **Real-time Tournament System**: Multi-size tournaments (2-32 players) with live updates
- **Creative Prompts**: Random creative text prompts for each match to inspire unique image generation
- **Image Submission**: Upload and submit AI-generated images via Supabase Storage
- **Community Voting**: Non-competing players vote for their favorite submissions
- **Live Bracket**: Real-time tournament bracket with match progression
- **Social Sharing**: Share victories to Instagram Stories, Twitter/X, or copy shareable links
- **About Page**: Beautiful landing page to explain the game to new players
- **User Authentication**: Secure email/password authentication
- **Responsive Design**: Beautiful, modern UI built with TailwindCSS

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (Database, Auth, Storage, Real-time)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- Git installed

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
npm install
```

### 2. Supabase Setup

1. **Create a Supabase Project**:

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Set up the Database**:

   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL to create all tables, policies, and functions

3. **Configure Storage**:

   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `images`
   - Set the bucket to public
   - Update the bucket policies to allow authenticated users to upload

4. **Set up Authentication**:
   - Go to Authentication > Settings in your Supabase dashboard
   - Configure your preferred auth providers (GitHub, Google, etc.)
   - Add your site URL to the allowed redirect URLs

### 3. Environment Variables

1. Copy the environment example file:

```bash
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:5173
```

You can find the Supabase values in your Supabase project settings under "API".

**Note**: `VITE_APP_URL` should be your production URL when deployed (e.g., `https://your-app.vercel.app`).

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional):

```bash
npm i -g vercel
```

2. **Deploy**:

```bash
vercel
```

3. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add the following environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_APP_URL`: Your production URL (e.g., `https://your-app.vercel.app`)

### Alternative: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy automatically on every push

## 🎮 How to Play

1. **Sign In**: Create an account with email and password
2. **Create Profile**: Choose a unique username
3. **Join Tournament**: Select or create a tournament (2-32 players)
4. **Wait for Start**: Admin starts the tournament when full
5. **Create & Submit**: Generate images based on the creative prompt
6. **Vote**: Vote for your favorite images in matches you're not competing in
7. **Advance**: Winners progress through the bracket until a champion is crowned
8. **Share Victory**: Winners can share their victory on social media!

## 🎉 Sharing Your Victory

When you win a tournament, you can share your achievement:

- **Instagram Story**: Opens Instagram with a pre-filled message and link to the about page
- **Twitter/X**: Opens Twitter with a victory tweet
- **Copy Link**: Copies a shareable link to your clipboard
- **Generic Share**: Uses your device's native share menu (mobile only)

All share links point to `/about` - a beautiful landing page that explains ImaginArena to newcomers!

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Lobby/          # Lobby and waiting room
│   ├── Tournament/     # Tournament bracket view
│   └── Match/          # Match and voting components
├── services/           # API and business logic
│   ├── authService.ts  # Authentication service
│   ├── tournamentService.ts # Tournament management
│   └── matchService.ts # Match and voting logic
├── store/              # Zustand state management
├── lib/                # Utilities and configurations
└── App.tsx            # Main application component
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication
- **tournaments**: Tournament instances and status
- **matches**: Individual tournament matches
- **submissions**: Image submissions for matches
- **votes**: User votes for submissions
- **tournament_participants**: Junction table for tournament membership

## 🔒 Security Features

- Row Level Security (RLS) policies on all tables
- Authenticated file uploads only
- Input validation and sanitization
- Secure OAuth integration
- Protected API endpoints

## 🎨 Customization

### Adding New Prompts

Edit the prompts array in `src/services/tournamentService.ts` to add new creative prompts for matches.

### Styling

The application uses TailwindCSS with custom components defined in `src/index.css`. Modify the color scheme by updating the primary colors in `tailwind.config.js`.

### Tournament Size

Currently configured for 16-player tournaments. To change this, update the logic in:

- `LobbyScreen.tsx` (participant grid)
- `tournamentService.ts` (tournament creation logic)
- Database functions in `schema.sql`

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**: Verify your environment variables are correct
2. **Authentication Issues**: Check your Supabase auth settings and redirect URLs
3. **Image Upload Fails**: Ensure the `images` bucket exists and has proper policies
4. **Real-time Updates Not Working**: Check your Supabase project's real-time settings

### Development Tips

- Use the browser's developer tools to monitor network requests
- Check the Supabase dashboard for database logs and errors
- Enable Supabase logging for detailed debugging information

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎯 Future Enhancements

- [ ] Multiple tournament formats (Swiss, Round Robin)
- [ ] Spectator mode for non-participants
- [ ] Tournament history and statistics
- [ ] Player rankings and leaderboards
- [ ] Custom prompt creation by users
- [ ] Mobile app version
- [ ] Integration with popular AI image generators
- [ ] Custom victory images for social sharing
- [ ] Tournament replay and highlights

---

Built with ❤️ using React, Supabase, and TailwindCSS
