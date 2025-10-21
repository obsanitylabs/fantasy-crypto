import Head from 'next/head';
import Link from 'next/link';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Layout({ children, title = 'Fantasy Crypto - Where Fantasy Meets DeFi' }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'PvP', href: '/pvp' },
    { name: 'PvE', href: '/pve' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'UNITE', href: '/unite' },
  ];

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Fantasy Football meets Crypto Trading - A DeFi platform for competitive crypto trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="Fantasy Football meets Crypto Trading - A DeFi platform for competitive crypto trading" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content="Fantasy Football meets Crypto Trading - A DeFi platform for competitive crypto trading" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Logo */}
                <Link href="/">
                  <div className="flex-shrink-0 flex items-center cursor-pointer">
                    <div className="text-2xl mr-2">🏈</div>
                    <span className="text-xl font-bold text-fantasy-primary">Fantasy Crypto</span>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:block ml-10">
                  <div className="flex items-baseline space-x-8">
                    {navigation.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <span className="text-gray-700 hover:text-fantasy-primary px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200">
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wallet Connection */}
              <div className="flex items-center">
                {isConnected ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {formatAddress(address)}
                    </span>
                    <button
                      onClick={() => open()}
                      className="btn-fantasy-primary"
                    >
                      Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => open()}
                    className="btn-fantasy-primary"
                  >
                    Connect Wallet
                  </button>
                )}

                {/* Mobile menu button */}
                <div className="md:hidden ml-4">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-gray-700 hover:text-fantasy-primary focus:outline-none focus:text-fantasy-primary"
                  >
                    {mobileMenuOpen ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span 
                      className="text-gray-700 hover:text-fantasy-primary block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-fantasy-dark text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-2">🏈</div>
                  <span className="text-xl font-bold">Fantasy Crypto</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Fantasy Football meets Crypto Trading. Trade responsibly.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/pvp"><span className="text-gray-400 hover:text-white cursor-pointer">Player vs Player</span></Link></li>
                  <li><Link href="/pve"><span className="text-gray-400 hover:text-white cursor-pointer">League Play</span></Link></li>
                  <li><Link href="/leaderboard"><span className="text-gray-400 hover:text-white cursor-pointer">Leaderboard</span></Link></li>
                  <li><Link href="/unite"><span className="text-gray-400 hover:text-white cursor-pointer">UNITE Token</span></Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Tutorials</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Community</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white">Discord</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Twitter</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Telegram</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">GitHub</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 Fantasy Crypto. All rights reserved. Built on Arbitrum.</p>
              <p className="mt-2">
                <span className="italic">"It's now or never"</span> - Trade responsibly and never risk more than you can afford to lose.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}