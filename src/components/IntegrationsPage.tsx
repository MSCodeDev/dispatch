"use client";

import { useState, useEffect } from "react";
import { api, type ApiKey } from "@/lib/client";
import { IconKey, IconCopy, IconTrash, IconPlus, IconCode, IconPuzzle } from "@/components/icons";

export function IntegrationsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("tasks");

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    setLoading(true);
    try {
      const keys = await api.apiKeys.list();
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const newKey = await api.apiKeys.create({ name: newKeyName.trim() });
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
      setShowNewKeyModal(false);
      setNewlyCreatedKey(newKey);
    } catch (err) {
      console.error("Failed to create API key:", err);
      alert("Failed to create API key. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteKey(id: string) {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      await api.apiKeys.delete(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete API key:", err);
      alert("Failed to delete API key. Please try again.");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  }

  const apiEndpoints = [
    {
      category: "Tasks",
      id: "tasks",
      endpoints: [
        {
          method: "GET",
          path: "/api/tasks",
          description: "List all tasks",
          example: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/tasks`,
        },
        {
          method: "POST",
          path: "/api/tasks",
          description: "Create a new task",
          example: `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New task","priority":"high"}' \\
  https://localhost:3000/api/tasks`,
        },
        {
          method: "PUT",
          path: "/api/tasks/:id",
          description: "Update a task",
          example: `curl -X PUT \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"done"}' \\
  https://localhost:3000/api/tasks/TASK_ID`,
        },
        {
          method: "DELETE",
          path: "/api/tasks/:id",
          description: "Delete a task",
          example: `curl -X DELETE \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/tasks/TASK_ID`,
        },
      ],
    },
    {
      category: "Projects",
      id: "projects",
      endpoints: [
        {
          method: "GET",
          path: "/api/projects",
          description: "List all projects",
          example: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/projects`,
        },
        {
          method: "POST",
          path: "/api/projects",
          description: "Create a new project",
          example: `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"New project","color":"blue"}' \\
  https://localhost:3000/api/projects`,
        },
      ],
    },
    {
      category: "Notes",
      id: "notes",
      endpoints: [
        {
          method: "GET",
          path: "/api/notes",
          description: "List all notes",
          example: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/notes`,
        },
        {
          method: "POST",
          path: "/api/notes",
          description: "Create a new note",
          example: `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New note","content":"Content here"}' \\
  https://localhost:3000/api/notes`,
        },
      ],
    },
    {
      category: "Dispatches",
      id: "dispatches",
      endpoints: [
        {
          method: "GET",
          path: "/api/dispatches",
          description: "List all dispatches",
          example: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/dispatches`,
        },
        {
          method: "POST",
          path: "/api/dispatches/:id/complete",
          description: "Complete a dispatch",
          example: `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  https://localhost:3000/api/dispatches/DISPATCH_ID/complete`,
        },
      ],
    },
  ];

  const selectedCategory = apiEndpoints.find((cat) => cat.id === selectedEndpoint);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Integrations</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Manage API keys and explore available endpoints
        </p>
      </header>

      {/* API Keys Section */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <IconKey className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">API Keys</h2>
          </div>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-neutral-900 dark:text-white">{key.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                      {key.key.substring(0, 20)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      title="Copy to clipboard"
                      className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                      <IconCopy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete API key"
                >
                  <IconTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* API Documentation Section */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <IconCode className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">API Documentation</h2>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-1">
            {apiEndpoints.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedEndpoint(category.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedEndpoint === category.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {category.category}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="col-span-9 space-y-4">
            {selectedCategory?.endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
              >
                <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        endpoint.method === "GET"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : endpoint.method === "POST"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : endpoint.method === "PUT"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-neutral-900 dark:text-white">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {endpoint.description}
                  </p>
                </div>
                <div className="bg-neutral-900 p-4">
                  <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                    {endpoint.example}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connectors Section */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <IconPuzzle className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Connectors</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <IconPuzzle className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Coming Soon
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
            Connect Dispatch to your favorite tools and services. Integrations with Slack, GitHub,
            Linear, and more are on the way.
          </p>
        </div>
      </section>

      {/* Create API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewKeyModal(false)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Create API Key
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || creating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNewlyCreatedKey(null)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              API Key Created
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg mb-4">
              <code className="text-sm text-neutral-900 dark:text-white font-mono break-all">
                {newlyCreatedKey.key}
              </code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(newlyCreatedKey.key)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <IconCopy className="w-4 h-4" />
                Copy Key
              </button>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
