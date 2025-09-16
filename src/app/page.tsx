import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowRight, CheckCircle2, Phone, MessageSquare, Users, Shield, Zap, Globe, Clock, Award, Star, Headphones, PhoneCall, Settings, Search, BarChart3, Mic, Video, FileText, Smartphone } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke('get-plans');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              The future of
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                business calling
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Get instant phone numbers, build smart call flows, and scale your communications 
              with the most advanced VoIP platform for modern businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a href="/sign-up" className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start free trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a href="#demo" className="inline-flex items-center px-8 py-4 text-gray-700 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-lg font-semibold">
                <Video className="mr-2 w-5 h-5" />
                Watch demo
              </a>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                24/7 support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From instant number provisioning to advanced analytics, 
              we've built the complete communication stack for growing businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Search className="w-8 h-8" />, 
                title: "Instant Number Search", 
                description: "Find and purchase phone numbers from 60+ countries in seconds. Local, toll-free, and vanity numbers available."
              },
              { 
                icon: <Settings className="w-8 h-8" />, 
                title: "Visual Call Flows", 
                description: "Build sophisticated call routing with our drag-and-drop interface. No coding required."
              },
              { 
                icon: <BarChart3 className="w-8 h-8" />, 
                title: "Real-time Analytics", 
                description: "Monitor call quality, track performance, and optimize your communication strategy with detailed insights."
              },
              { 
                icon: <Mic className="w-8 h-8" />, 
                title: "HD Voice Quality", 
                description: "Crystal-clear calls with advanced noise cancellation and adaptive bitrate technology."
              },
              { 
                icon: <Smartphone className="w-8 h-8" />, 
                title: "Multi-device Support", 
                description: "Take calls on desktop, mobile, or web. Your number follows you everywhere."
              },
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: "Enterprise Security", 
                description: "End-to-end encryption, HIPAA compliance, and SOC 2 Type II certification."
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by businesses worldwide</h2>
            <p className="text-blue-100 text-lg">Join thousands of companies that rely on Numsphere</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">10M+</div>
              <div className="text-blue-100 text-lg">Calls Processed</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50K+</div>
              <div className="text-blue-100 text-lg">Active Users</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-blue-100 text-lg">Uptime SLA</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">60+</div>
              <div className="text-blue-100 text-lg">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get started in minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined setup process gets you up and running faster than any other platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Choose your number",
                description: "Search and select from thousands of available numbers in your preferred area code or country."
              },
              {
                step: "02", 
                title: "Configure call flows",
                description: "Set up intelligent routing, voicemail, and forwarding rules with our visual editor."
              },
              {
                step: "03",
                title: "Start calling",
                description: "Make and receive calls instantly from any device. Your business phone system is ready."
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">What customers say</h2>
            <p className="text-xl text-gray-600">Real feedback from real businesses</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Numsphere completely transformed our customer service. Setup took 5 minutes and call quality is incredible.",
                author: "Sarah Chen",
                role: "CEO at TechFlow",
                rating: 5
              },
              {
                quote: "The global numbers feature helped us expand to 12 countries without any technical complexity.",
                author: "Michael Rodriguez", 
                role: "Operations Director at GlobalReach",
                rating: 5
              },
              {
                quote: "Best VoIP platform we've used. The analytics help us optimize our sales process every day.",
                author: "Emily Johnson",
                role: "Sales Manager at ConnectPro", 
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no long-term contracts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your business communications?</h2>
          <p className="text-xl text-blue-100 mb-12">
            Join thousands of businesses using Numsphere to deliver exceptional customer experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="/sign-up" className="inline-flex items-center px-8 py-4 text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-colors text-lg font-semibold shadow-lg">
              Start your free trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a href="#demo" className="inline-flex items-center px-8 py-4 text-white border-2 border-white/30 rounded-xl hover:border-white/50 transition-colors text-lg font-semibold">
              <Video className="mr-2 w-5 h-5" />
              Watch demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}