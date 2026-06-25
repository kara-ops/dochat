# DocChat Frontend

A modern React frontend for the DocChat RAG system.

## Features

- 📄 Upload PDF documents
- 🤖 Ask questions about your documents using RAG
- 🔐 OAuth authentication with Google
- 💾 Response caching
- ⚡ Real-time streaming responses
- 📱 Responsive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your configuration:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
src/
├── api/              # API client functions
│   ├── auth.ts      # Authentication endpoints
│   ├── documents.ts # Document management
│   ├── query.ts     # Query/RAG endpoints
│   └── client.ts    # Axios client configuration
├── components/       # React components
│   ├── Auth.tsx     # Login page
│   ├── Dashboard.tsx # Main dashboard
│   ├── DocumentUpload.tsx # File upload
│   ├── QueryInterface.tsx # Query interface
│   └── [*.css]      # Component styles
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## API Endpoints Used

The frontend connects to these backend endpoints:

- `POST /oauth/token` - OAuth login
- `GET /rag/documents` - List user documents
- `POST /rag/workspaces/{wk_id}/documents/upload` - Upload PDF
- `GET /rag/task/{task_id}` - Check upload status
- `POST /rag/query` - Query document with RAG

## Usage

### 1. Login

- Use Google OAuth or email/password to authenticate
- Token is stored in localStorage

### 2. Upload Documents

- Navigate to "Upload Documents" tab
- Select a workspace ID
- Choose a PDF file
- Upload - backend processes asynchronously

### 3. Ask Questions

- Navigate to "Ask Questions" tab
- Select a document from the dropdown
- Type your question
- Get AI-generated answers with citations

## Building for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **CSS3** - Styling

## Notes

- Backend must be running on `http://localhost:8000`
- Adjust `VITE_API_URL` for production deployments
- OAuth requires Google OAuth credentials configured
