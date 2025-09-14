import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowRight, CheckCircle2, Phone, MessageSquare, Users, Shield, Zap, Globe, Clock, Award, Star, Headphones, PhoneCall, Settings } from 'lucide-react';

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
              Trusted by businesses worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['Enterprise Corp', 'TechStart', 'Global Solutions', 'Innovation Labs', 'Business Pro', 'ConnectCorp'].map((company) => (
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
              Complete VoIP solution for modern businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From crystal-clear calls to advanced call flows, Numsphere provides 
              everything you need to revolutionize your business communications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { 
                icon: <PhoneCall className="w-8 h-8" />, 
                title: "HD Voice Quality", 
                description: "Crystal-clear voice calls with advanced noise cancellation and HD audio codecs for professional communication."
              },
              { 
                icon: <Settings className="w-8 h-8" />, 
                title: "Smart Call Flows", 
                description: "Design intelligent call routing with our visual flow builder. Route calls based on time, location, or custom rules."
              },
              { 
                icon: <Globe className="w-8 h-8" />, 
                title: "Global Numbers", 
                description: "Get local, toll-free, and international numbers from 60+ countries. Expand your business presence worldwide."
              },
              { 
                icon: <Users className="w-8 h-8" />, 
                title: "Team Collaboration", 
                description: "Built-in messaging, video calls, and file sharing. Keep your team connected across all devices."
              },
              { 
                icon: <Zap className="w-8 h-8" />, 
                title: "Real-time Analytics", 
                description: "Monitor call quality, track performance metrics, and get insights to optimize your communication strategy."
              },
              { 
                icon: <Shield className="w-8 h-8" />, 
                title: "Enterprise Security", 
                description: "End-to-end encryption, HIPAA compliance, and enterprise-grade security for all your communications."
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
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
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powering business communications globally</h2>
            <p className="text-blue-100 text-lg">Join thousands of businesses that trust Numsphere</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">1M+</div>
              <div className="text-blue-100 text-lg">Minutes Processed Daily</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">25K+</div>
              <div className="text-blue-100 text-lg">Active Businesses</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-blue-100 text-lg">Uptime SLA</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">60+</div>
              <div className="text-blue-100 text-lg">Countries Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What our customers say</h2>
            <p className="text-xl text-gray-600">Real feedback from real businesses</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Numsphere transformed our customer service. The call quality is exceptional and the smart routing has reduced wait times by 60%.",
                author: "Sarah Chen",
                role: "Operations Director at TechFlow",
                rating: 5
              },
              {
                quote: "The global number feature helped us expand internationally without the complexity. Setup was incredibly easy and support is outstanding.",
                author: "Michael Rodriguez",
                role: "CEO at GlobalReach Solutions",
                rating: 5
              },
              {
                quote: "Finally, a VoIP solution that just works. The call flows are intuitive and the analytics help us optimize our sales process.",
                author: "Emily Johnson",
                role: "Sales Manager at ConnectPro",
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
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Simple, scalable pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include our core VoIP features with transparent pricing.
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
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to revolutionize your business communications?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of businesses that use Numsphere to deliver exceptional customer experiences and streamline their communications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/sign-up" className="inline-flex items-center px-8 py-4 text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-colors text-lg font-semibold shadow-lg">
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