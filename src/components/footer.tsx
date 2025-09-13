import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <Link href="/" className="text-2xl font-bold text-white mb-4 block">
              NumSphere.online
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The smartest way to analyze numbers. Transform complex data into actionable insights with our powerful analytics platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/press" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
              <li>
                <a href="mailto:support@numsphere.online" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 NumSphere.online. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}