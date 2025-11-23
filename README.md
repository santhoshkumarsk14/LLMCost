# CostLLM - LLM Cost Optimization Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0.0-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-20.0.0-purple)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0.0-38B2AC)](https://tailwindcss.com/)

CostLLM is a comprehensive platform for optimizing and managing Large Language Model (LLM) API costs. It provides real-time monitoring, intelligent cost optimization, budget management, and enterprise-grade security features to help organizations reduce their AI infrastructure expenses by up to 85%.

## 🚀 Features

### Core Features
- **Real-time Cost Monitoring**: Track API usage, costs, and performance metrics across all LLM deployments
- **Intelligent Optimization**: AI-powered recommendations for model selection, prompt engineering, and usage patterns
- **Multi-Provider Support**: Native integration with OpenAI, Anthropic, and Google AI APIs
- **Smart Caching**: Automatic response caching to reduce redundant API calls and costs
- **Budget Management**: Set spending limits with automated alerts and notifications
- **Rate Limiting**: Built-in rate limiting with configurable thresholds per user
- **Model Routing**: Automatic model switching based on custom rules and conditions

### Analytics & Insights
- **Comprehensive Dashboard**: Real-time metrics, cost trends, and usage analytics
- **Cost Breakdown**: Detailed cost analysis by model, provider, and time period
- **Performance Metrics**: Latency tracking, cache hit rates, and efficiency scores
- **Export Capabilities**: CSV/PDF reports for cost analysis and compliance

### Security & Compliance
- **Enterprise Security**: Bank-level encryption, audit trails, and SOC 2 compliance
- **API Key Management**: Secure storage and rotation of provider API keys
- **Access Control**: Role-based permissions and user management
- **Data Privacy**: GDPR-compliant data handling and retention policies

### Developer Experience
- **RESTful API**: Clean, documented API for seamless integration
- **SDK Support**: Client libraries for popular programming languages
- **Webhook Integration**: Real-time notifications for cost events and alerts
- **TypeScript Support**: Full type safety and excellent developer experience

## 🏗️ Architecture

CostLLM is built with modern web technologies:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with server-side Supabase integration
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and OAuth providers
- **Payments**: Stripe integration for subscription management
- **Email**: Resend for transactional emails and notifications
- **Deployment**: Optimized for Vercel with edge runtime support

## 📋 Prerequisites

Before running CostLLM, ensure you have:

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project
- API keys for your preferred LLM providers (OpenAI, Anthropic, or Google)
- (Optional) Stripe account for payment processing
- (Optional) Resend account for email notifications

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/costllm.git
cd costllm
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption Secret (Generate a random 32-character string)
ENCRYPTION_SECRET=your-32-character-encryption-key

# Email Configuration (Optional)
RESEND_API_KEY=your-resend-api-key
```

### 3. Database Setup

Run the Supabase migration to set up your database schema:

```bash
# Apply the migration to your Supabase project
# You can do this via the Supabase dashboard or CLI
supabase db push
```

### 4. Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access CostLLM.

### 5. Build for Production

```bash
npm run build
npm start
```

## 📚 API Documentation

### Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer your-costllm-api-key
```

### Core Endpoints

#### Proxy API
Route requests through CostLLM for cost tracking and optimization:

```bash
POST /api/proxy
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ],
  "model": "gpt-3.5-turbo"
}
```

Response headers include cost and token information:
- `X-CostLLM-Cost`: Request cost in USD
- `X-CostLLM-Tokens`: Total tokens used
- `X-CostLLM-Cached`: Whether response was served from cache

#### Analytics API
Get comprehensive cost and usage analytics:

```bash
GET /api/analytics?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer your-api-key
```

Returns metrics including total cost, request counts, cache hit rates, and detailed breakdowns.

#### Budget Management
Monitor and manage spending budgets:

```bash
GET /api/budgets
POST /api/budgets/check
```

#### API Key Management
Manage your LLM provider API keys securely:

```bash
GET /api/api-keys
POST /api/api-keys
PUT /api/api-keys/{id}
DELETE /api/api-keys/{id}
```

### Rate Limits

- **Free Tier**: 10K requests/month
- **Starter**: 100K requests/month
- **Professional**: Unlimited requests
- **Enterprise**: Custom limits with SLA guarantees

Per-user rate limiting: 100 requests per minute.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `SUPABASE_JWT_SECRET` | JWT secret for auth | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `ENCRYPTION_SECRET` | 32-char encryption key | Yes |
| `RESEND_API_KEY` | Resend API key for emails | No |

### Optimization Rules

Configure intelligent model routing based on conditions:

```json
{
  "name": "Cost Optimization Rule",
  "source_model": "gpt-4",
  "target_model": "gpt-3.5-turbo",
  "conditions": {
    "promptLength": 100,
    "keywords": ["simple", "basic"],
    "timeOfDay": "off-peak"
  },
  "enabled": true
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

CostLLM is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation**: [docs.costllm.com](https://docs.costllm.com)
- **Community**: [Discord](https://discord.gg/costllm)
- **Email**: support@costllm.com
- **GitHub Issues**: For bug reports and feature requests

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Payments by [Stripe](https://stripe.com/)
- UI components from [Radix UI](https://radix-ui.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**CostLLM** - Optimizing the future of AI infrastructure costs.
