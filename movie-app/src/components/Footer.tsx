'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-dark mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">CineVault</h3>
            <p className="text-gray-400 text-sm">
              Your premium destination for movie discovery and recommendations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/genres" className="hover:text-primary transition-colors">Genres</a></li>
              <li><a href="/trending" className="hover:text-primary transition-colors">Trending</a></li>
              <li><a href="/new-releases" className="hover:text-primary transition-colors">New Releases</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/reviews" className="hover:text-primary transition-colors">Reviews</a></li>
              <li><a href="/discussions" className="hover:text-primary transition-colors">Discussions</a></li>
              <li><a href="/top-rated" className="hover:text-primary transition-colors">Top Rated</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/help" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="/contact" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>\u00a9 2024 CineVault. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  );
}