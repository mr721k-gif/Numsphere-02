import Link from "next/link";
import { ArrowRight, Check, Star, Users, Zap, Shield } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
      
      <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 10,000+ professionals worldwide
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
              The smartest way to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                analyze numbers
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              NumSphere.online transforms complex numerical data into actionable insights. 
              Get instant answers, powerful visualizations, and advanced analytics in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start analyzing for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <Link
                href="#demo"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 text-lg font-semibold shadow-sm hover:shadow-md"
              >
                Watch demo
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span>Setup in under 2 minutes</span>
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
            <span className="ml-4 text-sm text-gray-500">NumSphere Dashboard</span>
          </div>
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-cyan-50 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Your analytics dashboard awaits
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Powerful visualizations, real-time insights, and collaborative tools 
                all in one beautiful interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}