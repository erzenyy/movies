'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/for-you', label: 'For You' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv-shows', label: 'TV Shows' },
  { href: '/trending', label: 'Trending' },
  { href: '/user', label: 'User' },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    const setHeight = () => {
      const nextHeight = element.offsetHeight;
      setHeaderHeight(nextHeight);
      document.documentElement.style.setProperty('--app-header-height', `${nextHeight}px`);
    };

    setHeight();

    const observer = new ResizeObserver(() => setHeight());
    observer.observe(element);
    window.addEventListener('resize', setHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-[box-shadow,background-color,border-color] duration-300',
          'border-b backdrop-blur-xl backdrop-saturate-150',
          scrolled
            ? 'border-zinc-700/60 bg-zinc-950/90 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]'
            : 'border-zinc-800/40 bg-zinc-950/80 shadow-none'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent transition-opacity duration-300',
            scrolled ? 'opacity-100' : 'opacity-50'
          )}
          aria-hidden
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between gap-2 min-h-16 lg:min-h-[4.25rem] py-2 lg:py-0">
            <Link
              href="/"
              className="shrink-0 min-w-0 rounded-lg px-1 py-1 -ml-1 transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
            >
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[11rem] sm:max-w-none">
                Movie<span className="text-red-500">Flix</span>
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center gap-0.5 rounded-full border border-zinc-800/80 bg-zinc-900/50 p-1 shadow-inner shadow-black/20"
              aria-label="Main"
            >
              {NAV.map(({ href, label }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 text-sm font-medium transition-[color,background-color,box-shadow] duration-200',
                      active
                        ? 'text-white bg-zinc-800/95 shadow-md shadow-black/40 ring-1 ring-white/5'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                    )}
                  >
                    {active && (
                      <span
                        className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gradient-to-r from-red-600/0 via-red-500 to-red-600/0"
                        aria-hidden
                      />
                    )}
                    {label}
                  </Link>
                );
              })}
            </nav>

            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center gap-2 min-w-0 max-w-[min(16rem,40vw)] lg:max-w-none"
            >
              <div className="relative w-full group/search">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none transition-colors group-focus-within/search:text-red-400" />
                <Input
                  type="search"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 sm:w-48 lg:w-64 h-10 pl-10 rounded-full border-zinc-700/80 bg-zinc-900/60 text-white placeholder:text-zinc-500 shadow-inner shadow-black/20 transition-[border-color,box-shadow] focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/25"
                />
              </div>
            </form>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 h-10 w-10 rounded-xl text-white hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/50"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-zinc-800/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 duration-200">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative group/search">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-red-400" />
                  <Input
                    type="search"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 rounded-full border-zinc-700/80 bg-zinc-900/60 text-white placeholder:text-zinc-500 focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/25"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-1" aria-label="Mobile main">
                {NAV.map(({ href, label }) => {
                  const active = isNavActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-transparent',
                        active
                          ? 'text-white bg-zinc-800/90 border-zinc-700/50 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 hover:border-zinc-800'
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>
      <div aria-hidden className="w-full shrink-0" style={{ height: headerHeight }} />
    </>
  );
}
