import '../styles/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

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

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}