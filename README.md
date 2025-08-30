# NoCodeChatGPT with Google Gemini

A modern chat interface powered by Google Gemini AI, built with Next.js and TypeScript.

## Features

- 🤖 Chat with Google Gemini AI
- 💬 Real-time conversation interface
- 🎨 Modern, responsive UI built with shadcn/ui
- 🔒 Secure API key management
- 📱 Mobile-friendly design

## Prerequisites

- Node.js 18+
- Google Gemini API key

## Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd local_llm_ws
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   To get a Gemini API key:

   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Sign in with your Google account
   - Create a new API key
   - Copy the key to your `.env.local` file

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Type your message in the input field
2. Press Enter or click the Send button
3. Gemini AI will respond to your message
4. Continue the conversation as needed

## API Endpoints

- `POST /api/gemini` - Send messages to Gemini AI
  - Body: `{ "message": "your message here" }`
  - Response: `{ "response": "AI response", "model": "gemini-2.0-flash" }`

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui components
- **AI Service**: Google Gemini API
- **Styling**: Tailwind CSS

## Troubleshooting

- **"Gemini API key not configured"**: Make sure you have created a `.env.local` file with your `GEMINI_API_KEY`
- **API errors**: Verify your API key is valid and has sufficient quota
- **Rate limiting**: Gemini API has rate limits; wait a moment before sending another message

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
