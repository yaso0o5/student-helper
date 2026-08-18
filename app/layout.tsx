import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Student Helper', description: 'A focused AI study workspace' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
