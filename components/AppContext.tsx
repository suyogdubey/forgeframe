'use client';
import { createContext } from 'react';
export const AppContext = createContext<any>({ user: null, session: null, credits: 0, fetchCredits: () => {}, refreshCredits: () => {} });
