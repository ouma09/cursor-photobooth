# Photobooth

A retro-style instant camera photobooth web app with a modern, clean UI inspired by Cursor IDE aesthetics.

## Features

- 📸 **Instant Camera Experience**: Capture photos using your webcam with a retro polaroid camera interface
- 🎨 **Light, Modern UI**: Clean, minimalist design with a light color palette
- 📤 **Gallery Sharing**: Upload photos to a public gallery powered by Supabase
- 📧 **Email Sharing**: Send photos via email with a pre-filled template
- 🎯 **Interactive Polaroids**: Drag, flip, and customize your polaroid photos
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Supabase (Storage + Database)
- **Libraries**: 
  - html2canvas (for collage downloads)
  - Supabase JS Client

## Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/jackyzhong0124/cursor-photobooth.git
   cd cursor-photobooth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### Production Deployment (Vercel)

1. **Push to GitHub**
   - Make sure your code is pushed to a GitHub repository

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Set Environment Variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add these variables:
     ```
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - ⚠️ **Important:** The `VITE_` prefix is required for Vite to expose these to the client

4. **Redeploy**
   - After adding environment variables, trigger a redeploy from the Deployments tab

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase_migration.sql` in your Supabase SQL Editor
3. This will create:
   - A `gallery` table for storing photo metadata
   - A `photos` storage bucket for storing images
   - Row Level Security policies for public read/write access
4. Get your credentials from Project Settings > API

## Usage

1. Allow camera access when prompted
2. Click the shutter button to capture a photo
3. Drag polaroids around the desk
4. Click "Add to Gallery" to share publicly
5. Click "Email" to send via email
6. Click "View Gallery" to see all shared photos
7. Click "Download" to save your collage

## Project Structure

```
photobooth/
├── index.html         # Main HTML file
├── styles.css         # All CSS styles
├── app.js             # All JavaScript logic
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## License

MIT License - feel free to use this project for your own purposes!

## Author

**Jacky Zhong**
- X: [@JackyZhong0124](https://x.com/JackyZhong0124)
- GitHub: [@jackyzhong0124](https://github.com/jackyzhong0124)

## Acknowledgments

- Inspired by retro instant cameras and the Cursor IDE aesthetic
- Uses [Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker) font for authentic polaroid handwriting feel
- Special thanks to [@ann_nnng](https://x.com/ann_nnng) for inspiration and support

