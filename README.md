# Speaking Lab — Unit 1: My New School

Trò chơi luyện phát âm tiếng Anh cho học sinh lớp 6, dựa theo chủ đề Speaking của
**Unit 1 – My New School** (SGK *Tiếng Anh 6, Global Success*). Ứng dụng Next.js
(App Router) chạy cả front-end lẫn back-end (API routes) trên cùng một port, kết
nối MongoDB Atlas để lưu điểm, và deploy trực tiếp lên Vercel.

## Tính năng

- **10 câu hỏi, 3 mức độ**: Nhận biết (từ đơn) → Thông hiểu (cụm từ) → Vận dụng
  cao (câu hoàn chỉnh, theo chủ đề "loại trường mơ ước").
- **Chấm điểm phát âm bằng giọng nói**: dùng Web Speech API của trình duyệt
  (miễn phí, không cần API key ngoài) để nhận diện những gì học sinh nói và so
  sánh với đáp án bằng thuật toán tương đồng chuỗi (Levenshtein + word overlap).
- **Nghe mẫu phát âm** bằng Speech Synthesis trước khi thu âm.
- **Popup nhập username** trước khi vào bài test, lưu cục bộ trong phiên chơi.
- **Lưu kết quả vào MongoDB** khi bấm "Play again": mỗi lượt chơi tạo một bản
  ghi mới (username, score, correct/total) — `_id` của MongoDB là khoá duy nhất,
  username có thể lặp lại giữa các lượt chơi.
- **Scoreboard** (tab riêng): gọi API lấy danh sách điểm, hiển thị No, Username,
  Score, Correct answer (dạng `x/total`).
- Giao diện "phòng lab công nghệ": nền dạng lưới, hiệu ứng vòng sóng mic khi ghi
  âm, bảng tiến trình 10 câu chia màu theo 3 cấp độ.

## Yêu cầu trình duyệt

Web Speech API (`SpeechRecognition`) hiện chỉ hoạt động ổn định trên
**Google Chrome** và **Microsoft Edge** (desktop hoặc Android). Firefox/Safari
chưa hỗ trợ đầy đủ — ứng dụng sẽ hiển thị thông báo yêu cầu đổi trình duyệt nếu
không hỗ trợ.

## Cài đặt & chạy local

```bash
npm install
cp .env.example .env.local
# Mở .env.local và điền MONGODB_URI (connection string MongoDB Atlas của bạn)
npm run dev
```

Mở http://localhost:3000 — front-end và API (`/api/scores`) chạy chung một port.

## Biến môi trường

| Biến           | Bắt buộc | Mô tả                                               |
| --------------- | ---------- | ----------------------------------------------------- |
| `MONGODB_URI` | Có        | Connection string MongoDB Atlas (SRV hoặc standard). |
| `MONGODB_DB`  | Không     | Tên database, mặc định`speaking_lab`.           |

Trong MongoDB Atlas, nhớ mở **Network Access** cho phép kết nối từ `0.0.0.0/0`
(hoặc dải IP của Vercel) và tạo user có quyền đọc/ghi lên database.

## Cấu trúc dữ liệu (collection `scores`)

```json
{
  "_id": "ObjectId (auto, unique key)",
  "username": "string",
  "score": "number (0-100)",
  "correct": "number",
  "total": "number",
  "createdAt": "date"
}
```

## API

- `POST /api/scores` — body `{ username, score, correct, total }`, tạo một bản
  ghi điểm mới.
- `GET /api/scores` — trả về danh sách điểm sắp xếp giảm dần theo `score`, dùng
  cho tab Scoreboard.

## Deploy lên Vercel

1. Đẩy source code này lên một repository (GitHub/GitLab/Bitbucket).
2. Trên Vercel, chọn **New Project** → import repository.
3. Trong **Environment Variables**, thêm `MONGODB_URI` (và `MONGODB_DB` nếu
   muốn đổi tên database).
4. Deploy — Vercel tự build Next.js, front-end và API routes cùng chạy trên một
   domain/port do Vercel cấp.

## Tuỳ chỉnh nội dung câu hỏi

Danh sách 10 câu hỏi nằm trong `data/questions.js`, có thể chỉnh sửa từ/cụm
từ/câu, IPA, nghĩa tiếng Việt, và ngưỡng chấm điểm (`matchThreshold`) cho từng
câu.

Implement API Speak grading support (still work-in-progress)
