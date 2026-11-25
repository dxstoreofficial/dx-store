const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of required) {
  if (!process.env[key]) {
    console.error("Missing required environment variable:", key);
    process.exit(1);
  }
}

const app = express();
const port = Number(process.env.PORT || 10000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "https://dxstoreofficial.github.io";

const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin) return callback(null, true);
    return callback(new Error("Origin tidak diizinkan."));
  }
}));
app.use(express.json({ limit: "100kb" }));

async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ message: "Sesi login tidak valid." });
  req.user = data.user;
  next();
}

async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error || data?.role !== "admin") {
    return res.status(403).json({ message: "Akses khusus admin." });
  }
  next();
}

function getItemTable(itemType) {
  if (itemType === "product") return "products";
  if (itemType === "account") return "account_listings";
  return null;
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "DX STORE manual DANA QRIS API" });
});

app.post("/api/payments/create", requireUser, async (req, res) => {
  try {
    const { itemType, itemId } = req.body || {};
    const table = getItemTable(itemType);
    if (!table || !isUuid(itemId)) {
      return res.status(400).json({ message: "Item pesanan tidak valid." });
    }

    const columns = itemType === "product"
      ? "id,name,price,status"
      : "id,title,price,status";

    const { data: item, error: itemError } = await supabaseAdmin
      .from(table)
      .select(columns)
      .eq("id", itemId)
      .eq("status", "active")
      .maybeSingle();

    if (itemError || !item) {
      return res.status(404).json({ message: "Barang tidak tersedia." });
    }

    const amount = Number(item.price);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return res.status(400).json({ message: "Harga barang tidak valid." });
    }

    const itemName = String(item.name || item.title || "Item DX STORE").slice(0, 200);
    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: req.user.id,
        total_amount: amount,
        item_type: itemType,
        item_id: item.id,
        item_name: itemName,
        status: "pending"
      })
      .select("id,total_amount,status")
      .single();

    if (insertError || !order) throw insertError || new Error("Pesanan tidak berhasil disimpan.");

    return res.json({
      orderId: order.id,
      amount: Number(order.total_amount),
      status: order.status
    });
  } catch (error) {
    console.error("Create manual order error:", error.message);
    return res.status(500).json({ message: "Pesanan gagal dibuat. Silakan coba lagi." });
  }
});

app.post("/api/payments/submit-proof", requireUser, async (req, res) => {
  const { orderId, proofPath } = req.body || {};
  if (!isUuid(orderId) || typeof proofPath !== "string") {
    return res.status(400).json({ message: "Bukti pembayaran tidak valid." });
  }

  const allowedPath = new RegExp("^" + req.user.id + "/" + orderId + "\\.(jpg|png)$", "i");
  if (!allowedPath.test(proofPath)) {
    return res.status(400).json({ message: "Lokasi bukti pembayaran tidak valid." });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id,status")
    .eq("id", orderId)
    .eq("buyer_id", req.user.id)
    .maybeSingle();

  if (error || !order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  }
  if (!["pending", "review"].includes(order.status)) {
    return res.status(409).json({ message: "Pesanan tidak dapat menerima bukti lagi." });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ proof_path: proofPath, status: "review" })
    .eq("id", orderId)
    .eq("buyer_id", req.user.id)
    .in("status", ["pending", "review"])
    .select("id,status")
    .maybeSingle();

  if (updateError || !updated) {
    return res.status(409).json({ message: "Bukti gagal disimpan. Periksa status pesanan." });
  }

  return res.json({ received: true, status: updated.status });
});

app.get("/api/payments/status", requireUser, async (req, res) => {
  const orderId = String(req.query.orderId || "");
  if (!isUuid(orderId)) {
    return res.status(400).json({ message: "Nomor pesanan tidak valid." });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id,total_amount,status")
    .eq("id", orderId)
    .eq("buyer_id", req.user.id)
    .maybeSingle();

  if (error || !order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  }

  return res.json({
    orderId: order.id,
    amount: Number(order.total_amount),
    status: order.status
  });
});

app.get("/api/admin/orders", requireUser, requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id,buyer_id,total_amount,item_name,status,proof_path,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Load admin orders error:", error.message);
    return res.status(500).json({ message: "Daftar pesanan gagal dimuat." });
  }

  const orders = await Promise.all((data || []).map(async order => {
    let proofUrl = null;
    if (order.proof_path) {
      const { data: signed, error: signedError } = await supabaseAdmin
        .storage.from("payment-proofs")
        .createSignedUrl(order.proof_path, 300);
      if (!signedError) proofUrl = signed?.signedUrl || null;
    }

    return {
      order_id: order.id,
      buyer_id: order.buyer_id,
      amount: Number(order.total_amount),
      item_name: order.item_name || "Pesanan DX STORE",
      status: order.status,
      created_at: order.created_at,
      proof_url: proofUrl
    };
  }));

  return res.json({ orders });
});

app.patch("/api/admin/orders/:orderId", requireUser, requireAdmin, async (req, res) => {
  const orderId = req.params.orderId;
  const status = req.body?.status;

  if (!isUuid(orderId) || !["paid", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Perubahan status tidak valid." });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("status", "review")
    .select("id,status")
    .maybeSingle();

  if (error || !data) {
    return res.status(409).json({ message: "Pesanan tidak ditemukan atau sudah diproses." });
  }

  return res.json({ order_id: data.id, status: data.status });
});

app.listen(port, () => {
  console.log("DX STORE manual QRIS API listening on", port);
});
