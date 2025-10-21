import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient();

// Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'your-project-id';

const metadata = {
  name: 'Fantasy Crypto',
  description: 'Fantasy Football meets Crypto Trading',
  url: 'https://fantasycrypto.io',
  icons: ['https://fantasycrypto.io/icon.png']
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  chains: [arbitrum]
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  chains: [arbitrum],
  defaultChain: arbitrum,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#1a73e8',
    '--w3m-border-radius-master': '8px'
  }
});

// Supabase Auth Context
import { createContext, useContext } from 'react';

const SupabaseAuthContext = createContext();

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithWallet = async (walletAddress, signature, message) => {
    try {
      // In a real implementation, you'd verify the signature on the server
      // For now, we'll use a simple email/password approach with wallet address
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${walletAddress.toLowerCase()}@fantasycrypto.local`,
        password: walletAddress.toLowerCase()
      });
      
      if (error && error.message.includes('Invalid login credentials')) {
        // User doesn't exist, create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress.toLowerCase()}@fantasycrypto.local`,
          password: walletAddress.toLowerCase(),
          options: {
            data: {
              wallet_address: walletAddress.toLowerCase()
            }
          }
        });
        
        if (signUpError) throw signUpError;
        return signUpData;
      }
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signInWithWallet,
    signOut
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <SupabaseAuthProvider>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </WagmiProvider>
    </SupabaseAuthProvider>
  );
}

// Export the auth hook for use in other components
export { useSupabaseAuth };