// Features and logic by Wajihi Ramadan (JeehTech)
import { createContext, useContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';

type User = { id: number; email: string; role_id: number };
type State = { accessToken: string | null; user: User | null };
type Action = { type: 'LOGIN'; accessToken: string; user: User } | { type: 'LOGOUT' };

const AuthContext = createContext<{ state: State; dispatch: Dispatch<Action>; logout: () => void } | null>(null);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN':
      return { accessToken: action.accessToken, user: action.user };
    case 'LOGOUT':
      return { accessToken: null, user: null };
    default:
      return state;
  }
}

// Initial state from localStorage
const getInitialState = (): State => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      return { accessToken: token, user: JSON.parse(user) };
    } catch (e) {
      return { accessToken: null, user: null };
    }
  }
  return { accessToken: null, user: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  // Sync with localStorage
  useEffect(() => {
    if (state.accessToken && state.user) {
      localStorage.setItem('accessToken', state.accessToken);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }, [state.accessToken, state.user]);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return <AuthContext.Provider value={{ state, dispatch, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing');
  return ctx;
};
