import { NextResponse } from "next/server";
import { getScoresCollection } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// GET /api/scores — leaderboard, sorted by score desc, then correct desc, then earliest first
export async function GET() {
  try {
    const collection = await getScoresCollection();
    const docs = await collection
      .find({})
      .sort({ score: -1, correct: -1, createdAt: 1 })
      .limit(200)
      .toArray();

    const items = docs.map((doc, index) => ({
      no: index + 1,
      id: String(doc._id),
      username: doc.username,
      score: doc.score,
      correct: doc.correct,
      total: doc.total,
      correctAnswer: `${doc.correct}/${doc.total}`,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[GET /api/scores]", err);
    return NextResponse.json(
      { ok: false, error: "Không thể tải bảng xếp hạng. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

// POST /api/scores — save a new attempt (each "Play again" creates a new document)
export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().slice(0, 30);
    const correct = Number(body.correct);
    const total = Number(body.total);
    const score = Number(body.score);

    if (!username) {
      return NextResponse.json(
        { ok: false, error: "Thiếu username." },
        { status: 400 }
      );
    }
    if (
      !Number.isFinite(correct) ||
      !Number.isFinite(total) ||
      !Number.isFinite(score) ||
      total <= 0 ||
      correct < 0 ||
      correct > total ||
      score < 0 ||
      score > 100
    ) {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu điểm không hợp lệ." },
        { status: 400 }
      );
    }

    const collection = await getScoresCollection();
    const doc = {
      username,
      score,
      correct,
      total,
      createdAt: new Date(),
    };
    const result = await collection.insertOne(doc);

    return NextResponse.json({
      ok: true,
      item: { id: String(result.insertedId), ...doc },
    });
  } catch (err) {
    console.error("[POST /api/scores]", err);
    return NextResponse.json(
      { ok: false, error: "Không thể lưu kết quả. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
