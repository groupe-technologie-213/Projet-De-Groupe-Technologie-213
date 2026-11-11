import { parseLogs } from "../../../lib/parser/logParser";// TODO : GET = liste des logs importés, POST = import + analyse d'un fichier de logs
export async function GET() {
  return Response.json({ message: "Non implémenté" }, { status: 501 })
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ message: "Choisis un fichier non vide." }, { status: 400 });
    }

    const entries = parseLogs(await file.text());
    return Response.json({ count: entries.length, entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fichier invalide.";
    return Response.json({ message }, { status: 400 });
  }
}