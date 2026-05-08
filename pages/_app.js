// pages/_app.js
import '../styles/globals.css';
import '../styles/AnimatedBackground.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Clear auth on every fresh browser session (new tab / window / server restart).
    // sessionStorage is wiped when the tab is closed, so this runs once per session.
    if (typeof window !== 'undefined') {
      const sessionActive = sessionStorage.getItem('session_active');
      if (!sessionActive) {
        // First load of this browser session — clear any stale auth
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        // Mark this session as active so subsequent page navigations don't clear again
        sessionStorage.setItem('session_active', '1');
      }
    }
  }, []);

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}