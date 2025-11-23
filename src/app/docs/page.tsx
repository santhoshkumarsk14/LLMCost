'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, BookOpen, Code, Settings, HelpCircle, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';

const navigation = [
  { name: "Getting Started", href: "#getting-started", icon: BookOpen },
  { name: "Integration Guides", href: "#integration-guides", icon: Code },
  { name: "Features", href: "#features", icon: Zap },
  { name: "API Reference", href: "#api-reference", icon: FileText },
  { name: "FAQ", href: "#faq", icon: HelpCircle },
];

const quickStartCode = `import costllm

# Initialize the CostLLM client
client = costllm.Client(api_key="your-api-key")

# Track your LLM usage
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello, world!"}],
    cost_tracking=True
)

# Get cost insights
insights = client.get_cost_insights()
print(f"Total cost: \${insights['total_cost']}")
print(f"Estimated savings: \${insights['potential_savings']}")`;

const pythonIntegrationCode = `import costllm
from openai import OpenAI

# Initialize both clients
cost_client = costllm.Client(api_key="your-costllm-key")
openai_client = OpenAI(api_key="your-openai-key")

# Wrap your OpenAI calls with cost tracking
def tracked_completion(**kwargs):
    # Track the request
    cost_client.track_request("openai", "gpt-4", kwargs)

    # Make the actual request
    response = openai_client.chat.completions.create(**kwargs)

    # Track the response and calculate costs
    cost_client.track_response(response)

    return response

# Use the tracked function
response = tracked_completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Analyze this data..."}],
    max_tokens=1000
)

# Get real-time cost analytics
analytics = cost_client.get_analytics()
print(f"Current session cost: \${analytics['session_cost']}")`;

function CodeBlock({ code, language = 'python' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        className="rounded-md !mt-0"
        customStyle={{
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function DocsPage() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold">Documentation</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton onClick={() => scrollToSection(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">CostLLM Documentation</span>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Hero Section */}
            <section className="text-center py-12">
              <h1 className="text-4xl font-bold mb-4">CostLLM Documentation</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Learn how to integrate CostLLM into your applications and optimize your LLM costs with comprehensive guides and API references.
              </p>
            </section>

            {/* Quick Start */}
            <section id="getting-started" className="scroll-mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>
                    Get up and running with CostLLM in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Installation</h3>
                    <p className="text-muted-foreground mb-4">
                      Install CostLLM using pip:
                    </p>
                    <CodeBlock code="pip install costllm" language="bash" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
                    <p className="text-muted-foreground mb-4">
                      Here's a simple example to get started with cost tracking:
                    </p>
                    <CodeBlock code={quickStartCode} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Check out the <a href="#integration-guides" className="text-primary hover:underline">Integration Guides</a> for detailed setup instructions</li>
                      <li>Explore <a href="#features" className="text-primary hover:underline">Features</a> to understand all capabilities</li>
                      <li>Review the <a href="#api-reference" className="text-primary hover:underline">API Reference</a> for complete documentation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Python Integration Guide */}
            <section id="integration-guides" className="scroll-mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Python Integration Guide
                  </CardTitle>
                  <CardDescription>
                    Integrate CostLLM with your Python applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">OpenAI Integration</h3>
                    <p className="text-muted-foreground mb-4">
                      Seamlessly integrate cost tracking with your existing OpenAI API calls:
                    </p>
                    <CodeBlock code={pythonIntegrationCode} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Configuration Options</h3>
                    <p className="text-muted-foreground mb-4">
                      Customize CostLLM behavior with these configuration options:
                    </p>
                    <CodeBlock code={`cost_client = costllm.Client(
    api_key="your-key",
    environment="production",  # or "development"
    log_level="INFO",
    enable_real_time_tracking=True
)`} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supported Providers</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: "OpenAI", models: "GPT-4, GPT-3.5, DALL-E" },
                        { name: "Anthropic", models: "Claude-3, Claude-2" },
                        { name: "Google", models: "Gemini, PaLM" },
                        { name: "Azure OpenAI", models: "GPT-4, GPT-3.5" }
                      ].map((provider) => (
                        <div key={provider.name} className="p-4 border rounded-lg">
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.models}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Features */}
            <section id="features" className="scroll-mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Features
                  </CardTitle>
                  <CardDescription>
                    Discover all the powerful features CostLLM offers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      {
                        title: "Real-Time Cost Tracking",
                        description: "Monitor costs as they happen with millisecond precision"
                      },
                      {
                        title: "Multi-Provider Support",
                        description: "Track costs across OpenAI, Anthropic, Google, and more"
                      },
                      {
                        title: "Cost Optimization",
                        description: "AI-powered recommendations to reduce your LLM expenses"
                      },
                      {
                        title: "Detailed Analytics",
                        description: "Comprehensive insights into usage patterns and trends"
                      },
                      {
                        title: "Budget Management",
                        description: "Set spending limits and receive alerts when approaching thresholds"
                      },
                      {
                        title: "Enterprise Security",
                        description: "Bank-level encryption and compliance with industry standards"
                      }
                    ].map((feature) => (
                      <div key={feature.title} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* API Reference Placeholder */}
            <section id="api-reference" className="scroll-mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    API Reference
                  </CardTitle>
                  <CardDescription>
                    Complete API documentation for CostLLM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Detailed API reference documentation will be available here. For now, please refer to the code examples above and our GitHub repository for the latest API specifications.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Common questions and answers about CostLLM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      question: "How accurate is the cost tracking?",
                      answer: "CostLLM provides 99.9% accuracy in cost calculations based on the latest pricing from LLM providers."
                    },
                    {
                      question: "Can I use CostLLM with multiple LLM providers?",
                      answer: "Yes! CostLLM supports all major LLM providers and can track costs across multiple services simultaneously."
                    },
                    {
                      question: "Is my data secure?",
                      answer: "Absolutely. We use end-to-end encryption and never store your actual API calls or sensitive data."
                    },
                    {
                      question: "What programming languages are supported?",
                      answer: "Currently we support Python with SDKs. JavaScript/TypeScript and Go SDKs are coming soon."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium mb-2">{faq.question}</h4>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}