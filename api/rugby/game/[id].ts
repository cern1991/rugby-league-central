import { findLocalGameById } from "../../../server/lib/localData.js";

type RequestLike = {
  query: {
    id?: string | string[];
  };
};

type ResponseLike = {
  status: (code: number) => {
    json: (body: any) => void;
  };
};

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!rawId) {
      return res.status(400).json({ message: "Match id is required", response: [] });
    }

    let decodedId = rawId;
    try {
      decodedId = decodeURIComponent(rawId);
    } catch {
      decodedId = rawId;
    }

    const localMatch = findLocalGameById(decodedId);
    if (localMatch) {
      return res.status(200).json({ response: [localMatch] });
    }

    return res.status(200).json({ response: [] });
  } catch (error: any) {
    console.error("Serverless match error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load match",
      response: [],
    });
  }
}
