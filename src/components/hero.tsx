import Link from "next/link";
import { ArrowRight, Check, Star, Phone, Zap, Shield, PhoneCall, Globe, MessageSquare } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
      
      <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 25,000+ businesses worldwide
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
              The future of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                business communications
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Numsphere delivers crystal-clear VoIP calls, intelligent call routing, and global phone numbers. 
              Transform your business communications with our enterprise-grade platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start your free trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <Link
                href="#demo"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 text-lg font-semibold shadow-sm hover:shadow-md"
              >
                Schedule demo
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Enterprise security</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero image/demo section */}
      <div className="relative max-w-6xl mx-auto px-4 pb-20">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border">
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-4 text-sm text-gray-500">Numsphere Dashboard</span>
          </div>
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[400px]">
            <div className="grid md:grid-cols-3 gap-6 h-full">
              {/* Call Management */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Active Calls</h3>
                    <p className="text-sm text-gray-500">Real-time monitoring</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Sales Team</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Support Line</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Queue: 3</span>
                  </div>
                </div>
              </div>

              {/* Global Numbers */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Global Presence</h3>
                    <p className="text-sm text-gray-500">60+ countries</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-3 bg-red-500 rounded-sm"></div>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
                    <span>+44 20 7946 0958</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-3 bg-yellow-500 rounded-sm"></div>
                    <span>+49 30 12345678</span>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Call Analytics</h3>
                    <p className="text-sm text-gray-500">Today's metrics</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Calls</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Duration</span>
                    <span className="font-semibold">4:32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}