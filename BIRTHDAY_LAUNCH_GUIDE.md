# 🎉 Birthday Launch Guide for ImaginArena

## Quick Setup for Your Birthday Party

### Before the Party

1. **Deploy to Vercel** (if not already done):
   ```bash
   vercel --prod
   ```

2. **Set your production URL** in Vercel environment variables:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add/Update `VITE_APP_URL` with your production URL (e.g., `https://imaginarena.vercel.app`)
   - Redeploy if needed

3. **Test the share feature**:
   - Win a test tournament
   - Click "Share Victory"
   - Verify the `/about` page looks good
   - Test Instagram and Twitter sharing

### During the Party

1. **Share the About Page First**:
   - Send guests to `https://your-app.vercel.app/about`
   - This beautiful landing page explains the game
   - They can click "Get Started" to sign up

2. **As Admin, You Control Everything**:
   - Create tournaments of any size (2-32 players)
   - Start tournaments when everyone's ready
   - End voting when you want to reveal results
   - End tournaments to return everyone to lobby

3. **Encourage Social Sharing**:
   - Winners get a "Share Victory" button
   - They can share to Instagram Stories or Twitter
   - This creates buzz and explains the game to others!

### Share Links Explained

When someone shares their victory:
- **Instagram**: Opens Instagram app/web with message copied to clipboard
- **Twitter/X**: Opens Twitter with pre-filled tweet
- **Copy Link**: Copies `your-app.vercel.app/about` to clipboard
- **Generic Share**: Uses device's native share menu (mobile)

All links point to the `/about` page, which:
- Explains what ImaginArena is
- Shows beautiful animations
- Has a "Get Started" button to join
- Works without authentication (perfect for sharing!)

### Tips for Maximum Fun

1. **Start Small**: Begin with a 4 or 8-player tournament to get everyone familiar
2. **Use Fun Prompts**: The prompts are random but creative - embrace the chaos!
3. **Encourage Voting**: Non-players should vote - it keeps everyone engaged
4. **Share Victories**: Winners should share on Instagram Stories - great party content!
5. **Multiple Rounds**: Run several tournaments throughout the party

### Troubleshooting

- **Share not working?**: Make sure `VITE_APP_URL` is set in Vercel
- **About page not loading?**: Check that routing is working (vercel.json has rewrites)
- **Instagram not opening?**: The message is copied to clipboard - they can paste it manually

### Social Media Templates

**Instagram Story Text** (auto-generated):
```
🏆 Champion of ImaginArena!

Join the creative battle: [your-url]/about
```

**Twitter/X Text** (auto-generated):
```
🎨 I just won an ImaginArena tournament! 🏆

[Winner Name] conquered [X] players in a creative AI image battle!

Think you can beat me? Join the arena:
[your-url]/about
```

---

Have an amazing birthday party! 🎂🎨🏆
