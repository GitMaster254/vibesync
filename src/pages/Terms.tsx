import { ArrowLeft, FileText, Calendar, Shield, Mail, Github, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Terms of Service & Privacy Policy page
 */
export default function Terms() {
  return (
    <div className="min-h-screen pb-40 pt-4">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service & Privacy Policy</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last Updated: December 17, 2025</span>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Table of Contents
          </h2>
          <div className="grid gap-2 text-sm">
            {[
              { num: 1, title: "Introduction" },
              { num: 2, title: "Acceptance of Terms" },
              { num: 3, title: "Description of Service" },
              { num: 4, title: "Eligibility and Account Registration" },
              { num: 5, title: "User Responsibilities and Acceptable Use" },
              { num: 6, title: "Intellectual Property Rights" },
              { num: 7, title: "User Content and Data" },
              { num: 8, title: "Privacy Policy" },
              { num: 9, title: "Third-Party Services and Links" },
              { num: 10, title: "Disclaimers and Limitations of Liability" },
              { num: 11, title: "Indemnification" },
              { num: 12, title: "Modifications to Service and Terms" },
              { num: 13, title: "Termination" },
              { num: 14, title: "Dispute Resolution and Governing Law" },
              { num: 15, title: "Miscellaneous Provisions" },
              { num: 16, title: "Contact Information" },
            ].map((item) => (
              <a
                key={item.num}
                href={`#section-${item.num}`}
                className="flex items-center gap-3 py-1 hover:text-primary transition-colors"
              >
                <span className="text-muted-foreground">{item.num}.</span>
                <span>{item.title}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Terms Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-neutral dark:prose-invert max-w-none"
        >
          <div className="space-y-8">
            {/* Section 1 */}
            <section id="section-1">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to VibeSync ("we," "us," "our," or the "Service"). VibeSync is an offline-first Progressive Web Application (PWA) music player designed to provide users with fast local library management, seamless playback, and a beautiful, responsive user interface. This document constitutes a legally binding agreement between you ("User," "you," or "your") and VibeSync regarding your access to and use of our Service available at vibesync-neon.vercel.app and related platforms.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <h2 className="text-2xl font-bold mb-4">2. Acceptance of Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">2.1 Agreement to Terms</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing, browsing, or using VibeSync in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and any additional terms and conditions that may apply to specific features or services. If you do not agree to these Terms, you must immediately discontinue use of the Service.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">2.2 Changes to Terms</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify, update, or replace these Terms at any time at our sole discretion. Material changes will be communicated through the Service interface, email notification (if you have provided contact information), or by updating the "Last Updated" date above. Your continued use of the Service following the posting of changes constitutes your acceptance of such changes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <h2 className="text-2xl font-bold mb-4">3. Description of Service</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">3.1 Core Features</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">VibeSync provides the following core features:</p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li><strong>Offline-First Architecture:</strong> Local audio file storage and playback without requiring constant internet connectivity</li>
                    <li><strong>Library Management:</strong> Import, organize, and manage your personal music library</li>
                    <li><strong>Metadata Extraction:</strong> Automatic extraction of audio metadata using worker-based processing with optional server backend support</li>
                    <li><strong>Playlist Management:</strong> Create, edit, and manage custom playlists</li>
                    <li><strong>Favorites and Recently Played:</strong> Track and access your favorite songs and listening history</li>
                    <li><strong>Party Mode:</strong> Collaborative playlist and playback features</li>
                    <li><strong>Search Functionality:</strong> Search your library by song, artist, album, or other metadata</li>
                    <li><strong>Streaming Proxy:</strong> Lightweight serverless proxy for CORS-friendly remote audio streaming</li>
                    <li><strong>Responsive Design:</strong> Optimized interface for desktop and mobile devices</li>
                    <li><strong>Progressive Web App:</strong> Installable web application with offline capabilities</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <h2 className="text-2xl font-bold mb-4">5. User Responsibilities and Acceptable Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">5.1 Lawful Use</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to use VibeSync only for lawful purposes and in accordance with these Terms. You shall not violate any applicable local, state, national, or international law or regulation, infringe upon intellectual property rights, or upload illegal, harmful, or objectionable content.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">5.2 Copyright Compliance</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-3">
                    <p className="text-red-800 dark:text-red-200 font-semibold mb-2">Critical Responsibility:</p>
                    <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                      You are solely responsible for ensuring that any audio files you upload, store, or share through VibeSync are either owned by you, licensed to you for personal use, in the public domain, or used in accordance with fair use or other applicable copyright exceptions.
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    You may NOT upload copyrighted music files that you do not have the legal right to possess or use, share copyrighted material with others through Party Mode, use VibeSync to facilitate copyright infringement or piracy, or circumvent digital rights management (DRM) technologies.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <h2 className="text-2xl font-bold mb-4">8. Privacy Policy</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">8.1 Information Collection and Use</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Automatically Collected:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Device information</li>
                        <li>• Usage data</li>
                        <li>• Technical logs</li>
                        <li>• IP addresses (server features only)</li>
                      </ul>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Information You Provide:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Audio files</li>
                        <li>• Metadata</li>
                        <li>• Playlists and preferences</li>
                        <li>• Support communications</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">8.3 Data Storage and Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Local Storage:</strong> Most data is stored locally on your device using browser storage mechanisms. This data remains on your device and is not transmitted to our servers unless you use specific server-side features.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    <strong>Server-Side Processing:</strong> When you use optional features such as rich metadata extraction or streaming proxy, limited data is temporarily transmitted to our servers hosted on Vercel with industry-standard security measures.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10">
              <h2 className="text-2xl font-bold mb-4">10. Disclaimers and Limitations of Liability</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">10.1 No Warranties</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIBESYNC IS PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">10.2 Limitation of Liability</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIBESYNC AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES. IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS ($100).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 16 */}
            <section id="section-16">
              <h2 className="text-2xl font-bold mb-4">16. Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">General Inquiries</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Contact via GitHub</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Github className="h-4 w-4" />
                      <a href="https://github.com/GitMaster254" className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                        GitHub Profile
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href="https://vibesync-neon.vercel.app" className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">DMCA Copyright Agent</h3>
                  <p className="text-sm text-muted-foreground">
                    To report copyright infringement, please submit a DMCA notice through our GitHub repository with detailed information about the infringing material.
                  </p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-border pt-8">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-3">Acknowledgment</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using VibeSync, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and Privacy Policy. You also acknowledge that you have reviewed and agree to our open-source license terms (MIT License) as applicable to the codebase.
                </p>
                <p className="text-sm text-muted-foreground mt-3 font-medium">
                  Thank you for using VibeSync!
                </p>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-xs text-muted-foreground border-t border-border pt-6">
              <p>This document was last updated on December 17, 2025. Please check back periodically for updates.</p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}