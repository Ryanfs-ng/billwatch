import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Classe .dark no <html>; mesma chave que o app já usava, então a escolha salva continua valendo. */}
    <ThemeProvider attribute="class" storageKey="billwatch_tema" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Fora do #root de propósito: o Modal move o #toaster para dentro do <dialog> aberto, senão os
// toasts ficariam embaixo do fundo do modal. Os toasts funcionam igual (o toast() é global).
createRoot(document.getElementById('toaster')!).render(<Toaster />)
