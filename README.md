# Sewa Setu

A Next.js-based healthcare booking platform that allows users to search for hospitals, book appointments, and manage medical services.

## 🚀 Features

- Hospital search and filtering
- AI-powered assistance for booking queries
- Package-based medical service booking
- Stripe payment integration
- Location-based hospital search
- Real-time booking management
- Responsive design with modern UI

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** or **pnpm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- A code editor (VS Code recommended)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sanjayabhattarai/sewa-setu.git
cd sewa-setu
```

### 2. Install Dependencies

Choose one of the following package managers:

```bash
# Using npm
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

### 3. Environment Variables Setup

Create a `.env` or `.env.local` file in the root directory and add the following environment variables:

```env
# Database
DATABASE_URL="your_database_connection_string"

# Stripe (Payment Gateway)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Google AI (for AI assistant)
GOOGLE_AI_API_KEY="your_google_ai_api_key"

# Application URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

> ⚠️ **Note:** Contact the project admin to get the required API keys and credentials.

### 4. Database Setup

Initialize and set up the database using Prisma:

```bash
# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run the Development Server

Start the development server:

```bash
npm run dev
# OR
yarn dev
# OR
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
sewa-setu/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── book/         # Booking pages
│   │   ├── hospital/     # Hospital detail pages
│   │   └── search/       # Search pages
│   ├── components/       # Reusable React components
│   ├── data/            # Static data files
│   └── lib/             # Utility functions and libraries
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── package.json         # Project dependencies
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint to check code quality |

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, Lucide Icons
- **Database ORM:** Prisma
- **Payment:** Stripe
- **AI Integration:** Google Generative AI
- **Animations:** Framer Motion

## 🌿 Branch Workflow

- `main` - Production branch
- `sanjaya` - Development branch for Sanjaya
- Create feature branches from `main` for new features

## 🤝 Contributing

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make your changes and commit: `git commit -m "Add your message"`
3. Push to your branch: `git push origin feature/your-feature-name`
4. Create a Pull Request

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `GOOGLE_AI_API_KEY` | Google AI API key | Yes |
| `NEXT_PUBLIC_BASE_URL` | Application base URL | Yes |

## 🐛 Troubleshooting

### Common Issues

**1. Port 3000 already in use**
```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**2. Prisma Client issues**
```bash
# Regenerate Prisma Client
npx prisma generate
```

**3. Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For any questions or issues, please contact the project maintainer or create an issue in the repository.

## 📄 License

This project is private and confidential.

---

**Happy Coding! 🚀**
