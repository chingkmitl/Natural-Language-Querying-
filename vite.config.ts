import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() avoids TS error where Process type definition is incomplete in this context.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Expose API_KEY to the client-side code
      // WARNING: Be careful with exposing sensitive keys in client-side code.
      // For this serverless/static demo, it's necessary, but restrict usage in Google Cloud Console.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});