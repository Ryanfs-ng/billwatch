import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthContextValue {
  token: string | null;
  email: string | null;
  nome: string | null;
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "billwatch_token";

// Lê e-mail ("sub") e nome do payload do JWT só para exibição; quem valida o token é o backend.
function lerToken(token: string | null): { email: string | null; nome: string | null } {
  try {
    const base64 = token!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    // atob devolve bytes; o TextDecoder converte de UTF-8 para não quebrar acentos ("Conceição").
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    const payload = JSON.parse(json);
    return { email: payload.sub ?? null, nome: payload.nome ?? null };
  } catch {
    return { email: null, nome: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const signIn = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, ...lerToken(token), isAuthenticated: !!token, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
