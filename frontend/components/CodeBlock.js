import { useState } from 'react';

export default function CodeBlock({ code, language = 'bash', apiKey }) {
  const [copied, setCopied] = useState(false);

  const displayCode = apiKey ? code.replace(apiKey, 'XXXXX') : code;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-xl">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md transition"
        >
          {copied ? (
            <>
              <span>✓</span> Copied!
            </>
          ) : (
            <>
              <span>📋</span> Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-6 pt-14 overflow-x-auto text-sm">
        <code className={`text-gray-100 font-mono ${language === 'json' ? 'whitespace-pre' : ''}`}>
          {displayCode}
        </code>
      </pre>
    </div>
  );
}
