// components/imports/imports-table.tsx
"use client";

import { useState, useTransition } from "react";
import { renameImportAction, deleteImportAction } from "../../app/(app)/imports/actions";

export interface LogImportItem {
  id: string;
  name: string;
  created_at: string;
  event_count: number;
  skipped_lines: number;
  status: "pending" | "analyzed" | "failed";
}

interface ImportsTableProps {
  imports: LogImportItem[];
}

export function ImportsTable({ imports }: ImportsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleRename(id: string) {
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await renameImportAction(id, newName);
      if (!res.error) {
        setEditingId(null);
        setNewName("");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cet import et ses événements associés ?")) return;
    startTransition(async () => {
      await deleteImportAction(id);
    });
  }

  if (imports.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-white border rounded-lg shadow-sm">
        Aucun import de journaux pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b text-slate-700">
            <tr>
              <th className="p-3 font-semibold">Nom</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Statut</th>
              <th className="p-3 font-semibold">Événements</th>
              <th className="p-3 font-semibold">Ignorés</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {imports.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-medium">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button
                        disabled={isPending}
                        onClick={() => handleRename(item.id)}
                        className="bg-black text-white px-3 py-1 rounded text-xs"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="border px-3 py-1 rounded text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    item.name
                  )}
                </td>
                <td className="p-3 text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                      item.status === "analyzed"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">{item.event_count}</td>
                <td className="p-3">{item.skipped_lines}</td>
                <td className="p-3 text-right space-x-2">
                  {editingId !== item.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setNewName(item.name);
                        }}
                        className="border px-2 py-1 rounded text-xs"
                      >
                        Renommer
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}