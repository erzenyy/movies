'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { MovieCard } from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie, TVShow } from '@/lib/types';
import { searchMulti } from '@/lib/tmdb';
import { searchTVMaze } from '@/lib/tvmaze';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search both TMDB and TVMaze in parallel
        const [tmdbData, tvmazeData] = await Promise.all([
          searchMulti(query),
          searchTVMaze(query),
        ]);

        const tmdbFiltered = tmdbData.filter((item): item is (Movie | TVShow) => {
          const hasTitle = 'title' in item && !!item.title;
          const hasName = 'name' in item && !!item.name;
          return hasTitle || hasName;
        });

        // Deduplicate: prefer TMDB results, add TVMaze results that aren't already present
        const tmdbNames = new Set(tmdbFiltered.map((item) => 
          ('title' in item ? item.title : item.name).toLowerCase()
        ));
        const uniqueTvmaze = tvmazeData.filter(
          (show) => !tmdbNames.has(show.name.toLowerCase())
        );

        setResults([...tmdbFiltered, ...uniqueTvmaze]);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search for movies, TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-6 text-lg bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
          />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-6"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Results */}
      {query && (
        <div>
          <h1 className="text-2xl font-bold text-white mb-6">
            Search Results for "{query}"
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((item) => (
                <MovieCard 
                  key={item.id} 
                  movie={item} 
                  mediaType={'title' in item ? 'movie' : 'tv'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-zinc-400 text-lg">
                No results found for "{query}"
              </p>
              <p className="text-zinc-500 mt-2">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Search for Movies & TV Shows
          </h2>
          <p className="text-zinc-400">
            Enter a search term above to find your favorite content
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="pt-20">
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
