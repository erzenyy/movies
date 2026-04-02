'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Film, Tv, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              Movie<span className="text-red-500">Flix</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
              Home
            </Link>
            <Link href="/movies" className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
              Movies
            </Link>
            <Link href="/tv-shows" className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
              TV Shows
            </Link>
            <Link href="/trending" className="text-zinc-300 hover:text-white transition-colors text-sm font-medium">
              Trending
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="search"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-10 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
          </form>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-zinc-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800/50">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="search"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                Home
              </Link>
              <Link href="/movies" className="px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                Movies
              </Link>
              <Link href="/tv-shows" className="px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                TV Shows
              </Link>
              <Link href="/trending" className="px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors">
                Trending
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
