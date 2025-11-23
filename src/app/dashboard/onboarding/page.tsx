'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with LLM Cost' },
  { id: 'api-key', title: 'Add API Key', description: 'Connect your API provider' },
  { id: 'endpoint', title: 'Replace Endpoint', description: 'Update your code to use the proxy' },
  { id: 'budget', title: 'Set Budget', description: 'Configure spending limits' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' }
]

const addApiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  api_key: z.string().min(1, 'API key is required'),
  nickname: z.string().optional()
})

const budgetFormSchema = z.object({
  type: z.string().min(1, "Budget type is required"),
  limit: z.number().min(0, "Limit must be positive"),
  alertThreshold: z.number().min(0).max(100, "Threshold must be between 0 and 100"),
  notificationChannels: z.array(z.string()).min(1, "At least one notification channel is required")
})

type AddApiKeyForm = z.infer<typeof addApiKeySchema>
type BudgetFormData = z.infer<typeof budgetFormSchema>

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to LLM Cost</h1>
        <p className="text-muted-foreground mt-2">
          Let's get you set up to optimize your LLM API costs
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  index <= currentStep
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent>
          <StepContent stepId={steps[currentStep].id} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
        >
          {currentStep === steps.length - 2 ? 'Finish' : 'Next'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function StepContent({ stepId }: { stepId: string }) {
  switch (stepId) {
    case 'welcome':
      return <WelcomeStep />
    case 'api-key':
      return <ApiKeyStep />
    case 'endpoint':
      return <EndpointStep />
    case 'budget':
      return <BudgetStep />
    case 'complete':
      return <CompleteStep />
    default:
      return null
  }
}

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Welcome to LLM Cost!</h3>
        <p className="text-muted-foreground">
          Optimize your LLM API costs with intelligent caching, model routing, and budget management.
          We'll help you get started in just a few steps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-primary font-bold">1</span>
          </div>
          <h4 className="font-medium mb-1">Add API Key</h4>
          <p className="text-sm text-muted-foreground">Connect your OpenAI, Anthropic, or Google API key</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-primary font-bold">2</span>
          </div>
          <h4 className="font-medium mb-1">Update Code</h4>
          <p className="text-sm text-muted-foreground">Replace direct API calls with our proxy endpoint</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-primary font-bold">3</span>
          </div>
          <h4 className="font-medium mb-1">Set Budget</h4>
          <p className="text-sm text-muted-foreground">Configure spending limits and alerts</p>
        </div>
      </div>
    </div>
  )
}

function ApiKeyStep() {
  const [testingConnection, setTestingConnection] = useState(false)

  const form = useForm<AddApiKeyForm>({
    resolver: zodResolver(addApiKeySchema),
    defaultValues: {
      provider: 'openai',
      api_key: '',
      nickname: ''
    }
  })

  const testConnection = async (provider: string, apiKey: string) => {
    setTestingConnection(true)
    try {
      const response = await fetch('/api/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey })
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Connection test successful!')
        return true
      } else {
        toast.error(`Connection test failed: ${result.error}`)
        return false
      }
    } catch {
      toast.error('Connection test failed')
      return false
    } finally {
      setTestingConnection(false)
    }
  }

  const onSubmit = async (data: AddApiKeyForm) => {
    // Test connection first
    const testSuccess = await testConnection(data.provider, data.api_key)
    if (!testSuccess) return

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        toast.success('API key added successfully!')
        // Could trigger next step here
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add API key')
      }
    } catch {
      toast.error('Error adding API key')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Add your API key to get started. We'll securely store and encrypt your key.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="api_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="Enter your API key" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Production Key" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => testConnection(form.getValues('provider'), form.getValues('api_key'))}
              disabled={testingConnection}
            >
              {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
            <Button type="submit">Save API Key</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function EndpointStep() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')

  const codeExamples = {
    javascript: {
      before: `// Direct API call
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
})

const data = await response.json()`,
      after: `// Using LLM Cost proxy
const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.LLM_COST_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
})

const data = await response.json()`
    },
    python: {
      before: `# Direct API call
import openai

client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)`,
      after: `# Using LLM Cost proxy
import requests

response = requests.post('/api/proxy',
    headers={
        'Authorization': f'Bearer {os.getenv("LLM_COST_API_KEY")}',
        'Content-Type': 'application/json'
    },
    json={
        'endpoint': 'https://api.openai.com/v1/chat/completions',
        'model': 'gpt-3.5-turbo',
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

data = response.json()`
    },
    curl: {
      before: `# Direct API call
curl -X POST https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      after: `# Using LLM Cost proxy
curl -X POST /api/proxy \\
  -H "Authorization: Bearer $LLM_COST_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Update your code to use our proxy endpoint instead of calling APIs directly.
        This enables caching, cost tracking, and optimization features.
      </p>

      <div className="flex gap-2 mb-4">
        {Object.keys(codeExamples).map((lang) => (
          <Button
            key={lang}
            variant={selectedLanguage === lang ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLanguage(lang)}
            className="capitalize"
          >
            {lang}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">❌ Before (Direct API)</h4>
          <pre className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm overflow-x-auto">
            <code>{codeExamples[selectedLanguage as keyof typeof codeExamples].before}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-green-600">✅ After (LLM Cost Proxy)</h4>
          <pre className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm overflow-x-auto">
            <code>{codeExamples[selectedLanguage as keyof typeof codeExamples].after}</code>
          </pre>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Key Changes:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Change endpoint from provider URL to <code>/api/proxy</code></li>
          <li>• Move the provider endpoint to the <code>endpoint</code> field in request body</li>
          <li>• Use your LLM Cost API key instead of the provider key</li>
          <li>• All other parameters remain the same</li>
        </ul>
      </div>
    </div>
  )
}

function BudgetStep() {
  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      type: "Monthly API Budget",
      limit: 100,
      alertThreshold: 80,
      notificationChannels: ["email"]
    }
  })

  const onBudgetSubmit = (data: BudgetFormData) => {
    console.log("New budget:", data)
    toast.success("Budget created successfully!")
    // Could trigger next step here
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Set up a budget to monitor your spending and receive alerts when you approach your limits.
      </p>

      <Form {...budgetForm}>
        <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
          <FormField
            control={budgetForm.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Monthly API Budget" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={budgetForm.control}
            name="limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limit Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={budgetForm.control}
            name="alertThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Threshold (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="80"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={budgetForm.control}
            name="notificationChannels"
            render={() => (
              <FormItem>
                <FormLabel>Notification Channels</FormLabel>
                <div className="space-y-2">
                  {["email", "slack", "sms"].map((channel) => (
                    <FormField
                      key={channel}
                      control={budgetForm.control}
                      name="notificationChannels"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(channel)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, channel])
                                  : field.onChange(field.value?.filter((value) => value !== channel))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="capitalize">{channel}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Create Budget</Button>
        </form>
      </Form>
    </div>
  )
}

function CompleteStep() {
  return (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
      <p className="text-muted-foreground">
        Your LLM Cost setup is complete. You can now start using the optimized API endpoints.
      </p>
      <Button className="mt-4" asChild>
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  )
}