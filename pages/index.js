import Layout from '../components/Layout';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-fantasy-dark via-slate-900 to-fantasy-primary">
        {/* Hero Section */}
        <div className="relative pt-20 pb-32 flex content-center items-center justify-center min-h-screen">
          <div className="container relative mx-auto px-4">
            <div className="items-center flex flex-wrap">
              <div className="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Logo - Well-dressed Chinese guy with football */}
                  <div className="mb-8">
                    <div className="w-64 h-64 mx-auto mb-4 bg-gradient-to-br from-fantasy-accent to-fantasy-secondary rounded-full flex items-center justify-center shadow-2xl">
                      {/* Hail Mary pose - Chinese guy in sweater and collared shirt */}
                      <div className="relative">
                        <div className="text-6xl mb-2">👨🏻‍💼</div>
                        <div className="text-4xl absolute -top-2 -right-6 transform rotate-12">🏈</div>
                        <div className="text-lg absolute -bottom-4 left-1/2 transform -translate-x-1/2">😛</div>
                      </div>
                    </div>
                    <h1 className="text-white font-bold text-6xl mb-4">
                      Fantasy Crypto
                    </h1>
                    <p className="mt-4 text-2xl text-gray-300 font-semibold italic">
                      "It's now or never"
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative -mt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center">
              {/* PvP Card */}
              <motion.div
                className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link href="/pvp">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:transform hover:scale-105">
                    <div className="px-4 py-5 flex-auto">
                      <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-fantasy-danger">
                        <span className="text-2xl">⚔️</span>
                      </div>
                      <h6 className="text-xl font-semibold text-gray-800">Player vs Player</h6>
                      <p className="mt-2 mb-4 text-gray-600">
                        Go head-to-head with another trader in weekly competitions. Draft your coins and battle for supremacy.
                      </p>
                      <div className="mt-4 text-fantasy-primary font-medium">
                        Start Trading →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* PvE Card */}
              <motion.div
                className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link href="/pve">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:transform hover:scale-105">
                    <div className="px-4 py-5 flex-auto">
                      <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-fantasy-secondary">
                        <span className="text-2xl">🏆</span>
                      </div>
                      <h6 className="text-xl font-semibold text-gray-800">League Play</h6>
                      <p className="mt-2 mb-4 text-gray-600">
                        Join 12-player leagues for 90-day seasons. Draft strategically and climb the rankings.
                      </p>
                      <div className="mt-4 text-fantasy-secondary font-medium">
                        Join League →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Leaderboard Card */}
              <motion.div
                className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link href="/leaderboard">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:transform hover:scale-105">
                    <div className="px-4 py-5 flex-auto">
                      <div className="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-fantasy-accent">
                        <span className="text-2xl">📊</span>
                      </div>
                      <h6 className="text-xl font-semibold text-gray-800">Leaderboard</h6>
                      <p className="mt-2 mb-4 text-gray-600">
                        Track the best traders across all competitions. See who's making the most profit.
                      </p>
                      <div className="mt-4 text-fantasy-accent font-medium">
                        View Rankings →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Platform Stats Section */}
        <div className="relative bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Platform Statistics</h2>
              <p className="text-xl text-gray-600">See how Fantasy Crypto is revolutionizing DeFi trading</p>
            </div>
            <div className="flex flex-wrap justify-center">
              <div className="w-full md:w-3/12 lg:w-2/12 px-4 text-center">
                <div className="text-4xl font-bold text-fantasy-primary">$0</div>
                <div className="text-sm text-gray-600 mt-2">Total Volume</div>
              </div>
              <div className="w-full md:w-3/12 lg:w-2/12 px-4 text-center">
                <div className="text-4xl font-bold text-fantasy-secondary">0</div>
                <div className="text-sm text-gray-600 mt-2">Active Traders</div>
              </div>
              <div className="w-full md:w-3/12 lg:w-2/12 px-4 text-center">
                <div className="text-4xl font-bold text-fantasy-accent">0</div>
                <div className="text-sm text-gray-600 mt-2">Matches Played</div>
              </div>
              <div className="w-full md:w-3/12 lg:w-2/12 px-4 text-center">
                <div className="text-4xl font-bold text-fantasy-danger">0</div>
                <div className="text-sm text-gray-600 mt-2">UNITE Distributed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}