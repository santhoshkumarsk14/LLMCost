# CostLLM API Documentation

## Overview

CostLLM provides a comprehensive API for optimizing and monitoring Large Language Model (LLM) API costs. The API supports real-time cost tracking, intelligent model routing, budget management, and detailed analytics.

## Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer your-costllm-api-key
```

API keys can be generated and managed through the dashboard at `/dashboard/api-keys`.

## Base URL

```
https://api.costllm.com/v1
```

For local development:
```
http://localhost:3000/api
```

## Rate Limits

- **Free Tier**: 10K requests/month
- **Starter**: 100K requests/month
- **Professional**: Unlimited requests
- **Enterprise**: Custom limits with SLA guarantees

Per-user rate limiting: 100 requests per minute.

## Core Endpoints

### Proxy API

Route requests through CostLLM for cost tracking and optimization.

#### POST /api/proxy

Proxy LLM API requests with automatic cost tracking, caching, and optimization.

**Request Body:**
```json
{
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 100
}
```

**Response Headers:**
- `X-CostLLM-Cost`: Request cost in USD
- `X-CostLLM-Tokens`: Total tokens used
- `X-CostLLM-Cached`: Whether response was served from cache

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

**Supported Providers:**
- OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini Pro, Gemini Pro Vision)

### Analytics API

Get comprehensive cost and usage analytics.

#### GET /api/analytics

Retrieve detailed analytics for a specified date range.

**Query Parameters:**
- `start_date` (required): Start date in ISO format (YYYY-MM-DD)
- `end_date` (required): End date in ISO format (YYYY-MM-DD)

**Response:**
```json
{
  "metrics": [
    {
      "title": "Total Cost",
      "value": "$25.43",
      "change": "+12.5%",
      "changeType": "positive",
      "icon": "DollarSign"
    }
  ],
  "costOverTime": [
    {
      "name": "2024-01-01",
      "cost": 5.23,
      "requests": 45
    }
  ],
  "costByModel": [
    {
      "name": "gpt-4",
      "value": 15.67
    }
  ],
  "requestsByHour": [
    {
      "name": "09:00",
      "requests": 23
    }
  ],
  "tokenUsage": {
    "total": 125000,
    "byModel": {
      "gpt-4": 75000,
      "gpt-3.5-turbo": 50000
    }
  },
  "topRequests": [
    {
      "model": "gpt-4",
      "provider": "openai",
      "requests": 150,
      "cost": 18.50,
      "avgCost": 0.123
    }
  ]
}
```

### Budget Management

Monitor and manage spending budgets.

#### GET /api/budgets

Get all budgets for the authenticated user.

**Response:**
```json
[
  {
    "id": "budget-123",
    "user_id": "user-456",
    "type": "monthly",
    "budget_limit": 100.00,
    "current_spend": 45.67,
    "alert_threshold": 0.80,
    "status": "active",
    "notification_channels": ["email"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  }
]
```

#### POST /api/budgets

Create a new budget.

**Request Body:**
```json
{
  "type": "monthly",
  "budget_limit": 100.00,
  "alert_threshold": 0.80,
  "notification_channels": ["email"]
}
```

#### PUT /api/budgets/{id}

Update an existing budget.

#### DELETE /api/budgets/{id}

Delete a budget.

#### POST /api/budgets/check

Internal endpoint for budget checking (used by proxy service).

### API Key Management

Securely manage your LLM provider API keys.

#### GET /api/api-keys

Get all API keys for the authenticated user.

**Response:**
```json
[
  {
    "id": "key-123",
    "user_id": "user-456",
    "provider": "openai",
    "api_key": "encrypted-key-data",
    "nickname": "Production OpenAI Key",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/api-keys

Add a new API key.

**Request Body:**
```json
{
  "provider": "openai",
  "api_key": "sk-your-openai-api-key",
  "nickname": "Production Key"
}
```

#### PUT /api/api-keys/{id}

Update an API key.

#### DELETE /api/api-keys/{id}

Delete an API key.

#### POST /api/api-keys/regenerate

Regenerate the CostLLM API key for the authenticated user.

**Response:**
```json
{
  "api_key": "clm_new_generated_api_key"
}
```

#### POST /api/api-keys/test

Test an API key configuration.

**Request Body:**
```json
{
  "provider": "openai",
  "api_key": "sk-your-openai-api-key"
}
```

### Optimization Rules

Configure intelligent model routing based on custom conditions.

#### GET /api/optimization-rules

Get all optimization rules for the authenticated user.

**Response:**
```json
[
  {
    "id": "rule-123",
    "user_id": "user-456",
    "name": "Cost Optimization Rule",
    "source_model": "gpt-4",
    "target_model": "gpt-3.5-turbo",
    "conditions": {
      "promptLength": 100,
      "keywords": ["simple", "basic"],
      "timeOfDay": "off-peak"
    },
    "enabled": true,
    "savings_usd": 25.50,
    "created_at": "2024-01-01T00:00:00Z",
    "metrics": {
      "total_applications": 150,
      "success_rate": 0.85,
      "total_savings": 25.50
    }
  }
]
```

#### POST /api/optimization-rules

Create a new optimization rule.

**Request Body:**
```json
{
  "name": "Cost Optimization Rule",
  "sourceModel": "gpt-4",
  "targetModel": "gpt-3.5-turbo",
  "conditions": {
    "promptLength": 100,
    "keywords": ["simple", "basic"],
    "timeOfDay": "off-peak"
  },
  "enabled": true
}
```

#### PATCH /api/optimization-rules

Update an existing optimization rule.

#### DELETE /api/optimization-rules

Delete an optimization rule.

#### POST /api/optimization-rules/test

Test an optimization rule against sample data.

### Health Check

Monitor system health and performance.

#### GET /api/health

Get system health status and metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "details": "Connected"
    },
    "memory": {
      "status": "healthy",
      "details": "Heap used: 85.23MB"
    },
    "performance": {
      "status": "healthy",
      "details": "Avg response time: 245ms"
    }
  },
  "metrics": {
    "uptime": 86400,
    "memory": {
      "used": 89200000,
      "total": 128000000,
      "external": 2000000,
      "rss": 120000000
    },
    "performance": {
      "averageResponseTime": 245,
      "totalRequests": 1000,
      "errorRate": 0.02,
      "cacheHitRate": 0.75,
      "memoryUsage": 89000000
    },
    "cpu": {
      "user": 120000,
      "system": 80000
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error information:

```json
{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY",
  "details": "The provided API key is not valid or has expired"
}
```

**Common Error Codes:**
- `400`: Bad Request - Invalid request parameters
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Insufficient permissions
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Webhooks

CostLLM supports webhooks for real-time notifications of important events.

### Supported Events

- `budget.alert`: Budget threshold exceeded
- `budget.exceeded`: Budget limit exceeded
- `api_key.invalid`: API key became invalid
- `optimization.applied`: Optimization rule was applied

### Webhook Payload

```json
{
  "event": "budget.alert",
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user-456",
  "data": {
    "budget_id": "budget-123",
    "current_spend": 85.00,
    "threshold": 80.00,
    "budget_limit": 100.00
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```javascript
import { CostLLM } from '@costllm/sdk'

const client = new CostLLM({
  apiKey: 'your-costllm-api-key'
})

// Make a proxied request
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ]
})

console.log('Cost:', response.headers['x-costllm-cost'])
console.log('Tokens:', response.headers['x-costllm-tokens'])
```

### Python SDK

```python
from costllm import CostLLM

client = CostLLM(api_key='your-costllm-api-key')

response = client.chat.completions.create(
    model='gpt-4',
    messages=[
        {'role': 'user', 'content': 'Hello, world!'}
    ]
)

print(f"Cost: ${response.headers['x-costllm-cost']}")
print(f"Tokens: {response.headers['x-costllm-tokens']}")
```

## Best Practices

### Cost Optimization

1. **Use Model Routing**: Configure optimization rules to automatically route requests to cost-effective models
2. **Implement Caching**: Enable response caching for repeated queries
3. **Monitor Usage**: Regularly review analytics to identify optimization opportunities
4. **Set Budgets**: Use budget controls to prevent unexpected costs

### Performance

1. **Batch Requests**: Send multiple requests in batches when possible
2. **Use Streaming**: Enable streaming responses for better user experience
3. **Monitor Latency**: Track response times and optimize slow endpoints
4. **Cache Frequently Used Prompts**: Leverage the built-in caching system

### Security

1. **Rotate API Keys**: Regularly rotate your CostLLM and provider API keys
2. **Use HTTPS**: Always use HTTPS in production
3. **Monitor Access**: Review audit logs for suspicious activity
4. **Set Rate Limits**: Configure appropriate rate limits for your use case

## Support

- **Documentation**: https://docs.costllm.com
- **API Status**: https://status.costllm.com
- **Community**: https://community.costllm.com
- **Email Support**: support@costllm.com

## Changelog

### v1.0.0 (Current)
- Initial release with core proxy, analytics, and budget management features
- Support for OpenAI, Anthropic, and Google AI providers
- Real-time cost monitoring and optimization rules
- Comprehensive dashboard and API documentation