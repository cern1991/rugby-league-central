import { findLocalTeamMeta } from "../../../../server/lib/localData";

type RequestLike = {
  query: Record<string, string | string[]>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const slugify = (value?: string | number | null) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    const rawId = getQueryValue(req.query.id);
    if (!rawId) {
      return res.status(400).json({ message: "Team id is required", response: [] });
    }

    const metaById = findLocalTeamMeta(rawId);
    if (metaById) {
      return res.status(200).json({ response: [metaById] });
    }

    const slug = slugify(rawId);
    const fallback = findLocalTeamMeta(slug);
    return res.status(200).json({ response: fallback ? [fallback] : [] });
  } catch (error: any) {
    console.error("Serverless team error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load team",
      response: [],
    });
  }
}
