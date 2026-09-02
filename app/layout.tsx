import type { Metadata } from 'next';
import './globals.css';
import './open-layout.css';
import './weekly.css';
export const metadata: Metadata = { title: '하루 — 나만의 데일리 플래너', description: '하루의 시간을 차분하게 계획하고 기록하는 데일리 플래너' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
