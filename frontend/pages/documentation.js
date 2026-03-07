import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import CodeBlock from '../components/CodeBlock';
import { useAuth } from '../services/useAuth';
import { authAPI } from '../services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function Documentation() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        setApiKey(response.data.user.api_key || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const curlSend = `curl -X POST ${API_BASE}/api/send \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"number":"919876543210","message":"Hello from WPAnyWhere!"}'`;

  const curlSendMedia = `curl -X POST ${API_BASE}/api/send-media \\
  -H "x-api-key: ${apiKey}" \\
  -F "to=919876543210" \\
  -F "file=@image.jpg" \\
  -F "caption=Check this!"`;

  const curlSendMediaUrl = `curl -X POST ${API_BASE}/api/send-media-url \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"919876543210","url":"https://example.com/image.jpg","caption":"Image"}'`;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Documentation | WPAnyWhere</title>
      </Head>
      <div className="max-w-4xl space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">API Reference</h2>
          <p className="text-gray-600">Use your API key to authenticate requests. Base URL: <code className="bg-gray-200 px-2 py-0.5 rounded">{API_BASE}</code></p>
        </div>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Send Text Message</h3>
          <p className="text-gray-600 mb-4">Send a text message to a WhatsApp number.</p>
          <CodeBlock code={curlSend} apiKey={apiKey} />
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Send Media (File Upload)</h3>
          <p className="text-gray-600 mb-4">Upload and send an image, video, or document.</p>
          <CodeBlock code={curlSendMedia} apiKey={apiKey} />
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Send Media from URL</h3>
          <p className="text-gray-600 mb-4">Send media by providing a URL. Works with URLs without file extensions.</p>
          <CodeBlock code={curlSendMediaUrl} apiKey={apiKey} />
        </section>
      </div>
    </Layout>
  );
}
