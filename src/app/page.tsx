import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowRight, CheckCircle2, Calculator, BarChart3, TrendingUp, Users, Zap, Shield, Star, Globe, Clock, Award } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke('supabase-functions-get-plans');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* Social proof section */}
      <section className="py-16 bg-gray-50 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-8">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Netflix'].map((company) => (
                <div key={company} className="text-2xl font-bold text-gray-400">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Everything you need to analyze data
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple calculations to complex statistical analysis, NumSphere provides 
              all the tools you need in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { 
                icon: <Calculator className="w-8 h-8" />, 
                title: "Advanced Calculations", 
                description: "Perform complex mathematical operations with precision and speed. Support for all mathematical functions and custom formulas."
              },
              { 
                icon: <BarChart3 className="w-8 h-8" />, 
                title: "Data Visualization", 
                description: "Create stunning charts and graphs that tell your data's story. Interactive visualizations that update in real-time."
              },
              { 
                icon: <TrendingUp className="w-8 h-8" />, 
                title: "Statistical Analysis", 
                description: "Comprehensive statistical tools including regression analysis, hypothesis testing, and predictive modeling."
              },
              { 
                icon: <Users className="w-8 h-8" />, 
                title: "Team Collaboration", 
                description: "Share insights with your team, collaborate on projects, and maintain version control of your analyses."
              },
              { 
                icon: <Zap className="w-8 h-8" />, 
                title: "Real-time Processing", 
                description: "Get instant results as you work. Our cloud infrastructure processes your data at lightning speed."
              },
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: "Enterprise Security", 
                description: "Bank-level security with end-to-end encryption, SSO integration, and compliance with industry standards."
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                <div className="text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300">
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
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powering data analysis worldwide</h2>
            <p className="text-indigo-100 text-lg">Join thousands of professionals who trust NumSphere</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50M+</div>
              <div className="text-indigo-100 text-lg">Calculations Processed</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
              <div className="text-indigo-100 text-lg">Active Users</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-indigo-100 text-lg">Uptime Guaranteed</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">150+</div>
              <div className="text-indigo-100 text-lg">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What our users say</h2>
            <p className="text-xl text-gray-600">Don't just take our word for it</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "NumSphere has revolutionized how we handle data analysis. The insights we get are incredible and the interface is so intuitive.",
                author: "Sarah Chen",
                role: "Data Scientist at TechCorp",
                rating: 5
              },
              {
                quote: "The real-time collaboration features have made our team 10x more productive. We can't imagine working without NumSphere now.",
                author: "Michael Rodriguez",
                role: "Research Director at InnovateLab",
                rating: 5
              },
              {
                quote: "Finally, a platform that makes complex statistical analysis accessible to everyone on our team, not just the data experts.",
                author: "Emily Johnson",
                role: "Product Manager at StartupXYZ",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include our core features with no hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your data analysis?</h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who use NumSphere to make data-driven decisions faster and more accurately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/sign-up" className="inline-flex items-center px-8 py-4 text-indigo-600 bg-white rounded-xl hover:bg-gray-50 transition-colors text-lg font-semibold shadow-lg">
              Start your free trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a href="#demo" className="inline-flex items-center px-8 py-4 text-white border-2 border-white/30 rounded-xl hover:border-white/50 transition-colors text-lg font-semibold">
              Schedule a demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}