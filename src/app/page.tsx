'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, DollarSign, TrendingDown, Users, Zap, Shield, BarChart3, Star } from 'lucide-react';

export default function Home() {

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10" />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <Badge variant="secondary" className="mb-4 bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300">
            💰 Smart LLM Cost Management
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-6">
            Take Control of Your LLM API Costs
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Monitor, optimize, and reduce your large language model expenses with real-time insights, intelligent routing, and automated budget controls.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
              <Link href="/auth/signup">
                Start Saving Today <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToSection('pricing')} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-700/50">
              View Pricing
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              The Hidden Cost of AI
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Enterprises are spending millions on LLM APIs without visibility into usage patterns, leading to skyrocketing costs and inefficient resource allocation.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Unpredictable Costs",
                description: "API costs fluctuate wildly without proper monitoring, leading to budget overruns."
              },
              {
                icon: BarChart3,
                title: "Lack of Insights",
                description: "No visibility into which models or prompts are driving the highest costs."
              },
              {
                icon: Shield,
                title: "Security Risks",
                description: "Sensitive data exposure through unmonitored API calls and usage."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 dark:bg-slate-800/50 dark:border-slate-700 h-full">
                  <CardHeader>
                    <item.icon className="h-12 w-12 text-red-500 mb-4" />
                    <CardTitle className="text-slate-900 dark:text-white">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 dark:text-slate-400">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for LLM Cost Control
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Take control of your LLM spending with advanced monitoring, intelligent routing, budget controls, and comprehensive analytics.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Real-Time Monitoring",
                description: "Monitor API usage, costs, and performance metrics in real-time across all your LLM providers and deployments."
              },
              {
                icon: TrendingDown,
                title: "Intelligent Routing",
                description: "Automatically route requests to the most cost-effective models based on your requirements, performance needs, and budget constraints."
              },
              {
                icon: Shield,
                title: "Budget Controls",
                description: "Set spending limits, receive alerts, and enforce cost policies to prevent budget overruns and maintain financial control."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 dark:bg-slate-800/50 dark:border-slate-700 h-full">
                  <CardHeader>
                    <item.icon className="h-12 w-12 text-green-500 mb-4" />
                    <CardTitle className="text-slate-900 dark:text-white">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 dark:text-slate-400">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process to transform your LLM cost management.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect & Monitor",
                description: "Integrate with your existing LLM APIs and start monitoring usage in real-time."
              },
              {
                step: "02",
                title: "Configure & Optimize",
                description: "Set up intelligent routing rules, budget controls, and analytics dashboards to optimize your LLM usage."
              },
              {
                step: "03",
                title: "Scale & Save",
                description: "Implement optimizations and watch your costs drop while maintaining performance."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include core features with usage-based pricing.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for small teams getting started",
                features: ["Up to 10K API calls/month", "Basic monitoring", "Email support", "1 user"]
              },
              {
                name: "Professional",
                price: "$49/month",
                description: "For growing teams with advanced needs",
                features: ["Up to 100K API calls/month", "Advanced analytics", "Priority support", "5 users", "Custom integrations"],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Tailored solutions for large organizations",
                features: ["Unlimited API calls", "White-label solution", "Dedicated support", "Unlimited users", "SLA guarantee"]
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className={`bg-white/10 backdrop-blur-md border border-white/20 dark:bg-slate-800/50 dark:border-slate-700 h-full ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="text-center">
                    {plan.popular && <Badge className="mb-2 bg-blue-500 text-white">Most Popular</Badge>}
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-slate-600 dark:text-slate-400">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                      <Link href="/auth/signup">
                        {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="social-proof" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join thousands of companies optimizing their LLM costs with intelligent routing and real-time monitoring.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "CostLLM helped us reduce our OpenAI API costs by 35% while maintaining response quality. The intelligent routing is a game-changer.",
                author: "Sarah Chen",
                title: "CTO, TechFlow Solutions",
                company: "TechFlow Solutions"
              },
              {
                quote: "The real-time monitoring and budget controls gave us the visibility we needed to manage our AI expenses effectively across multiple teams.",
                author: "Marcus Rodriguez",
                title: "Head of AI, DataCorp",
                company: "DataCorp"
              },
              {
                quote: "Implementation was seamless, and the cost savings were immediate. Our developers love the analytics dashboard.",
                author: "Emily Watson",
                title: "VP Engineering, InnovateLabs",
                company: "InnovateLabs"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 dark:bg-slate-800/50 dark:border-slate-700 h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-slate-600 dark:text-slate-400 mb-4 italic">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{testimonial.title}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Active Users", value: "10,000+" },
                { label: "API Calls Monitored", value: "500M+" },
                { label: "Cost Savings", value: "$2M+" },
                { label: "Uptime", value: "99.9%" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about CostLLM.
            </p>
          </motion.div>
          <Accordion type="single" collapsible className="bg-white/10 backdrop-blur-md border border-white/20 dark:bg-slate-800/50 dark:border-slate-700 rounded-lg">
            {[
              {
                question: "How does CostLLM help reduce LLM costs?",
                answer: "CostLLM offers real-time monitoring of API usage and costs, intelligent routing to cost-effective models, automated budget controls with alerts, and comprehensive analytics to identify optimization opportunities—all while maintaining performance."
              },
              {
                question: "Is my data secure with CostLLM?",
                answer: "Yes, we use bank-level encryption, comply with GDPR and SOC 2 standards, and never store your actual API calls or sensitive data. All monitoring is done in real-time without data persistence."
              },
              {
                question: "Can I integrate CostLLM with my existing infrastructure?",
                answer: "Absolutely! CostLLM supports all major LLM providers including OpenAI, Anthropic, Google, and Azure OpenAI. We provide SDKs and APIs for seamless integration."
              },
              {
                question: "What kind of support do you offer?",
                answer: "We offer email support for all plans, priority support for Professional plans, and dedicated account management with SLA guarantees for Enterprise customers."
              },
              {
                question: "Can I try CostLLM before committing?",
                answer: "Yes! Our Starter plan is completely free and includes all core features. You can upgrade or downgrade at any time without any setup fees."
              }
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">CostLLM</h3>
              <p className="text-slate-400 mb-4">
                Optimizing LLM costs for the future of AI.
              </p>
              <Button asChild variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                <Link href="/auth/signup">
                  Get Started
                </Link>
              </Button>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2024 CostLLM. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
