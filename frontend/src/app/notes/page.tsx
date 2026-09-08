"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    async function fetchNotes() {
      const token = localStorage.getItem("access");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await apiRequest("/notes/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setNotes(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load notes",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [router]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("access");

    try {
      const note = await apiRequest("/notes/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      setNotes((current) => [note, ...current]);

      setTitle("");
      setContent("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create note",
      );
    }
  }

  async function handleUpdate(id: number) {
    const token = localStorage.getItem("access");

    try {
      const updatedNote = await apiRequest(`/notes/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });

      setNotes((currentNotes) =>
        currentNotes.map((note) => (note.id === id ? updatedNote : note)),
      );

      setEditingId(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update note",
      );
    }
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("access");

    try {
      await apiRequest(`/notes/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete note",
      );
    }
  }

  async function handleLogout() {
    const accessToken = localStorage.getItem("access");
    const refreshToken = localStorage.getItem("refresh");

    try {
      await apiRequest("/auth/logout/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      router.push("/login");
    }
  }

  if (loading) {
    return <p className="p-8">Loading notes...</p>;
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text">My Notes</h1>

        <button
          onClick={handleLogout}
          className="rounded border px-4 py-2 transition hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 space-y-4 rounded-lg border p-6"
      >
        <h2 className="text-xl font-semibold">Create Note</h2>

        <input
          className="w-full rounded border p-2"
          placeholder="Note title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <textarea
          className="w-full rounded border p-2"
          placeholder="Note content"
          rows={5}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
        />

        <button
          type="submit"
          className="rounded bg-black px-5 py-2 text-white transition hover:bg-gray-800"
        >
          Add Note
        </button>
      </form>

      <section className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-gray-500">You don&apos;t have any notes yet.</p>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="rounded-lg border p-5">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full rounded border p-2"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />

                  <textarea
                    className="w-full rounded border p-2"
                    rows={5}
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      className="rounded bg-black px-4 py-2 text-white transition hover:bg-gray-800"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded border px-4 py-2 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">{note.title}</h2>

                      <p className="mt-2 text-gray-600">{note.content}</p>

                      <p className="mt-4 text-sm text-gray-400">
                        Created: {new Date(note.created_at).toLocaleString()}
                      </p>

                      <p className="text-sm text-gray-400">
                        Updated: {new Date(note.updated_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditTitle(note.title);
                          setEditContent(note.content);
                        }}
                        className="text-blue-500 transition hover:text-blue-700 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-500 transition hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
