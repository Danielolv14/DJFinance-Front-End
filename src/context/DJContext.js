import React, { createContext, useContext, useState } from 'react';

const DJContext = createContext();

export const DJ_CONFIG = {
  DRUDS: {
    id: 'DRUDS',
    nome: 'DJ Druds',
    pin: '1402',
    subtitulo: 'Painel Financeiro',
  },
  BRAICHI: {
    id: 'BRAICHI',
    nome: 'Braichi DJ',
    pin: '2580',
    subtitulo: 'Painel Financeiro',
  },
};

export function DJProvider({ children }) {
  const [djAtivo, setDjAtivo] = useState(() => localStorage.getItem('djAtivo') || null);

  const login = (djId) => {
    localStorage.setItem('djAtivo', djId);
    setDjAtivo(djId);
  };

  const logout = () => {
    localStorage.removeItem('djAtivo');
    setDjAtivo(null);
  };

  return (
    <DJContext.Provider value={{
      djAtivo,
      djConfig: djAtivo ? DJ_CONFIG[djAtivo] : null,
      login,
      logout,
    }}>
      {children}
    </DJContext.Provider>
  );
}

export const useDJ = () => useContext(DJContext);
