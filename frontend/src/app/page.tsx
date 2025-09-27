'use client';

import Link from 'next/link';
import { Shield, Users, Activity, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-white font-bold text-lg transform -rotate-3">M</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">MediChain.AI</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/auth/login" className="text-white/90 hover:text-white font-medium transition-all duration-300 hover:scale-105">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  Secure Healthcare
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Data with AI
                </span>
              </h1>
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                MediChain.AI revolutionizes healthcare data management by combining 
                <span className="text-blue-300 font-semibold"> blockchain security</span>, 
                <span className="text-purple-300 font-semibold"> AI-powered insights</span>, and 
                <span className="text-pink-300 font-semibold"> seamless patient-controlled access</span>. 
                Own your health data like never before.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <Link
                href="/auth/register"
                className="group bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-10 py-5 rounded-full text-lg font-bold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25 flex items-center justify-center"
              >
                Start Your Journey
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="#features"
                className="group border-2 border-white/30 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Learn More
                <Shield className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative">
              {/* Decorative elements around video */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-4 shadow-2xl border border-white/20">
                <video
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source src="/Instient_Video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl rotate-12 animate-bounce shadow-lg"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-gradient-to-b from-slate-900 to-gray-900 py-32">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-white/10 mb-8">
              <h2 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent px-8 py-4">
                Why Choose MediChain.AI?
              </h2>
            </div>
            <p className="text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Experience the future of healthcare data management with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Blockchain Security</h3>
                <p className="text-white/70 text-center leading-relaxed">
                  Your medical data is secured with Polygon blockchain technology, ensuring immutable and transparent records with military-grade encryption.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">AI-Powered Insights</h3>
                <p className="text-white/70 text-center leading-relaxed">
                  Get intelligent summaries and predictive analysis of your medical records with our advanced AI system powered by machine learning.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Patient-Controlled</h3>
                <p className="text-white/70 text-center leading-relaxed">
                  You own and control your health data. Share with doctors and hospitals on your terms with granular permission controls.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Easy Access</h3>
                <p className="text-white/70 text-center leading-relaxed">
                  Access your records anytime with QR codes, biometric authentication, OTP verification, or seamless wallet connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Transform Healthcare Data Management
              </h2>
              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-400 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl mb-2">Secure & Private</h3>
                    <p className="text-white/70 leading-relaxed">End-to-end encryption with blockchain verification and zero-knowledge proofs for maximum privacy</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-blue-400 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl mb-2">Interoperable</h3>
                    <p className="text-white/70 leading-relaxed">Seamlessly works across hospitals, clinics, and healthcare providers worldwide</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-purple-400 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl mb-2">AI-Enhanced</h3>
                    <p className="text-white/70 leading-relaxed">Smart insights, predictive analytics, and personalized medical recommendations</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-pink-400 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl mb-2">Patient-Centric</h3>
                    <p className="text-white/70 leading-relaxed">You control who accesses your data, when, and for what purpose with smart contracts</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Ready to Get Started?</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    Join thousands of patients, doctors, and hospitals already using MediChain.AI 
                    to secure and revolutionize medical data sharing.
                  </p>
                  <Link
                    href="/auth/register"
                    className="group inline-flex items-center bg-gradient-to-r from-white to-blue-50 text-blue-600 px-8 py-4 rounded-2xl font-bold hover:from-blue-50 hover:to-white transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    Create Your Account
                    <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-t from-black via-gray-900 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">MediChain.AI</span>
              </div>
              <p className="text-white/70 leading-relaxed mb-6 text-lg">
                Securing healthcare data with blockchain and AI technology. 
                Empowering patients, doctors, and healthcare providers worldwide.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <span className="text-white font-bold">X</span>
                </div>
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <span className="text-white font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <span className="text-white font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">Product</h4>
              <ul className="space-y-3 text-white/70">
                <li><Link href="#features" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">Legal</h4>
              <ul className="space-y-3 text-white/70">
                <li><Link href="/privacy" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Terms of Service</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">FAQ</Link></li>
                <li><Link href="/compliance" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Compliance</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">Support</h4>
              <ul className="space-y-3 text-white/70">
                <li><Link href="/help" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Contact Support</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">API Reference</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/50 text-center md:text-left">&copy; 2025 MediChain.AI. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-white/50">Built with ❤️ for Healthcare</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/50 text-sm">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
