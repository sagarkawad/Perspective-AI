

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Perspective AI',
  description: 'Discover Different Perspectives',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// frontend/src/app/layout.tsx
// frontend/src/app/layout.tsx

// 'use client';

// import './globals.css';
// import RelatedTopicsSidebar from '../app/components/RelatedTopicsSidebar';
// import { useState, useEffect } from 'react';

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [content, setContent] = useState('');

//   useEffect(() => {
//     // Fetch the current content from the server or local state
//     // For example, if you have a context or global state management
//     setContent('Your current content here');
//   }, []);

//   return (
//     <div className="container">
//       <main>{children}</main>
//       <RelatedTopicsSidebar content={content} />
//     </div>
//   );
// }