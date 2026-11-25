import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_ORIGIN = Deno.env.get("DX_FRONTEND_ORIGIN") || "https://dxstoreofficial.github.io";

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  });

  const corsHeaders = {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Vary": "Origin",
          };

          function json(data: unknown, status = 200) {
            return new Response(JSON.stringify(data), {
                status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                      });
                      }

                      function isUuid(value: unknown): value is string {
                        return typeof value === "string" &&
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
                            }

                            function getItemTable(itemType: unknown) {
                              if (itemType === "product") return "products";
                                if (itemType === "account") return "account_listings";
                                  return null;
                                  }

                                  async function getUser(req: Request) {
                                    const header = req.headers.get("Authorization") || "";
                                      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
                                        if (!token) return null;
                                          const { data, error } = await authClient.auth.getUser(token);
                                            return error ? null : data.user;
                                            }

                                            async function ensureStoreAcceptingOrders() {
  const { data, error } = await adminClient
    .from("store_settings")
    .select("is_open, maintenance_mode, opening_time, closing_time, timezone")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) {
    console.error("Store availability check failed:", error?.message || "settings missing");
    return { ok: false, status: 503, message: "Status toko belum dapat diverifikasi. Silakan coba lagi nanti." };
  }
  if (!data.is_open || data.maintenance_mode) {
    return { ok: false, status: 409, message: "Toko sedang tutup atau dalam pemeliharaan. Pesanan baru belum dapat dibuat." };
  }
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
  const opening = String(data.opening_time || "").trim();
  const closing = String(data.closing_time || "").trim();
  const timezone = String(data.timezone || "Asia/Jakarta").trim();
  if (!timePattern.test(opening) || !timePattern.test(closing)) {
    return { ok: false, status: 503, message: "Jadwal operasional toko belum valid. Hubungi admin." };
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error("Invalid local time");
    const [, openHour, openMinute] = opening.match(timePattern);
    const [, closeHour, closeMinute] = closing.match(timePattern);
    const now = hour * 60 + minute;
    const start = Number(openHour) * 60 + Number(openMinute);
    const end = Number(closeHour) * 60 + Number(closeMinute);
    const inHours = start <= end ? now >= start && now < end : now >= start || now < end;
    if (!inHours) return { ok: false, status: 409, message: "Toko sedang di luar jam operasional. Silakan buat pesanan saat toko buka." };
    return { ok: true, status: 200, message: "" };
  } catch (error) {
    console.error("Invalid store timezone:", error);
    return { ok: false, status: 503, message: "Zona waktu operasional toko tidak valid. Hubungi admin." };
  }
}
async function isAdmin(userId: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin role lookup failed:", error.message, error.code);
    return false;
  }
  if (!data) {
    console.error("Admin role profile missing for user:", userId);
    return false;
  }
  const allowed = String(data.role || "").trim().toLowerCase() === "admin";
  if (!allowed) console.error("Admin role denied:", { userId, role: data.role });
  return allowed;
}

                                                                Deno.serve(async (req: Request) => {
                                                                  const origin = req.headers.get("Origin");
                                                                    if (origin && origin !== FRONTEND_ORIGIN) return json({ message: "Origin tidak diizinkan." }, 403);
                                                                      if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

                                                                        const url = new URL(req.url);
                                                                          const path = url.pathname;
                                                                            const user = await getUser(req);
                                                                              const protectedPath = path.includes("/api/payments/") || path.includes("/api/admin/");
                                                                                if (protectedPath && !user) return json({ message: "Silakan masuk terlebih dahulu." }, 401);

                                                                                  if (req.method === "POST" && path.endsWith("/api/payments/create")) {
    const storeStatus = await ensureStoreAcceptingOrders();
    if (!storeStatus.ok) return json({ message: storeStatus.message }, storeStatus.status);
    try {
      const body = await req.json();
      if (!getItemTable(body?.itemType) || !isUuid(body?.itemId)) return json({ message: "Item pesanan tidak valid." }, 400);
      const { data: order, error } = await adminClient.rpc("dx_create_order_with_reservation", {
        p_buyer_id: user!.id, p_item_type: body.itemType, p_item_id: body.itemId,
      });
      if (error || !order) {
        console.error("Create order RPC:", error?.message);
        const unavailable = error?.message?.includes("DX_ITEM_UNAVAILABLE");
        return json({ message: unavailable ? "Barang sudah dipesan atau telah terjual." : "Pesanan gagal dibuat." }, unavailable ? 409 : 500);
      }
      return json({ orderId: order.id, amount: Number(order.amount), status: order.status });
    } catch (error) {
      console.error("Create order:", error);
      return json({ message: "Permintaan pesanan tidak valid." }, 400);
    }
  }

  if (req.method === "POST" && path.endsWith("/api/payments/submit-proof")) {
                                                                                                                                                                                                                                                                                                                            try {
                                                                                                                                                                                                                                                                                                                                  const body = await req.json();
                                                                                                                                                                                                                                                                                                                                        const orderId = body?.orderId;
                                                                                                                                                                                                                                                                                                                                              const proofPath = body?.proofPath;
                                                                                                                                                                                                                                                                                                                                                    if (!isUuid(orderId) || typeof proofPath !== "string") return json({ message: "Bukti pembayaran tidak valid." }, 400);

                                                                                                                                                                                                                                                                                                                                                          const allowedPath = new RegExp("^" + user!.id + "/" + orderId + "\\.(jpg|png)$", "i");
                                                                                                                                                                                                                                                                                                                                                                if (!allowedPath.test(proofPath)) return json({ message: "Lokasi bukti pembayaran tidak valid." }, 400);

                                                                                                                                                                                                                                                                                                                                                                      const { data: order, error } = await adminClient.from("orders")
                                                                                                                                                                                                                                                                                                                                                                              .select("id,status").eq("id", orderId).eq("buyer_id", user!.id).maybeSingle();
                                                                                                                                                                                                                                                                                                                                                                                    if (error || !order) return json({ message: "Pesanan tidak ditemukan." }, 404);
                                                                                                                                                                                                                                                                                                                                                                                          if (!["pending", "review"].includes(order.status)) return json({ message: "Pesanan tidak dapat menerima bukti lagi." }, 409);

                                                                                                                                                                                                                                                                                                                                                                                                const { data: updated, error: updateError } = await adminClient.from("orders")
                                                                                                                                                                                                                                                                                                                                                                                                        .update({ proof_path: proofPath, status: "review" })
                                                                                                                                                                                                                                                                                                                                                                                                                .eq("id", orderId).eq("buyer_id", user!.id).in("status", ["pending", "review"])
                                                                                                                                                                                                                                                                                                                                                                                                                        .select("id,status").maybeSingle();

                                                                                                                                                                                                                                                                                                                                                                                                                              if (updateError || !updated) return json({ message: "Bukti gagal disimpan. Periksa status pesanan." }, 409);
                                                                                                                                                                                                                                                                                                                                                                                                                                    return json({ received: true, status: updated.status });
                                                                                                                                                                                                                                                                                                                                                                                                                                        } catch {
                                                                                                                                                                                                                                                                                                                                                                                                                                              return json({ message: "Permintaan bukti pembayaran tidak valid." }, 400);
                                                                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                                                                                                                                                                                      if (req.method === "GET" && path.endsWith("/api/payments/status")) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                          const orderId = url.searchParams.get("orderId") || "";
                                                                                                                                                                                                                                                                                                                                                                                                                                                              if (!isUuid(orderId)) return json({ message: "Nomor pesanan tidak valid." }, 400);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                  const { data: order, error } = await adminClient.from("orders")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .select("id,total_amount,status").eq("id", orderId).eq("buyer_id", user!.id).maybeSingle();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            if (error || !order) return json({ message: "Pesanan tidak ditemukan." }, 404);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                return json({ orderId: order.id, amount: Number(order.total_amount), status: order.status });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    if (path.endsWith("/api/admin/orders") && req.method === "GET") {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        if (!await isAdmin(user!.id)) return json({ message: "Akses khusus admin." }, 403);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const { data, error } = await adminClient.from("orders")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  .select("id,buyer_id,total_amount,item_name,item_type,item_id,status,proof_path,created_at")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .order("created_at", { ascending: false }).limit(100);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            if (error) return json({ message: "Daftar pesanan gagal dimuat." }, 500);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                const orders = await Promise.all((data || []).map(async (order) => {
          let proofUrl = null;
          if (order.proof_path) {
            const { data: signed, error: signedError } = await adminClient.storage
              .from("payment-proofs").createSignedUrl(order.proof_path, 300);
            if (!signedError) proofUrl = signed?.signedUrl || null;
          }

          let imageUrl = null;
          if (order.item_id && order.item_type === "product") {
            const { data: item, error: imageError } = await adminClient
              .from("products").select("image_url").eq("id", order.item_id).maybeSingle();
            if (imageError) console.error("Order product image lookup failed:", order.id, imageError.message);
            imageUrl = item?.image_url || null;
          } else if (order.item_id && ["account", "account_listing"].includes(order.item_type)) {
            const { data: item, error: imageError } = await adminClient
              .from("account_listings").select("image_url").eq("id", order.item_id).maybeSingle();
            if (imageError) console.error("Order account image lookup failed:", order.id, imageError.message);
            imageUrl = item?.image_url || null;
          }

          return {
            order_id: order.id,
            image_url: imageUrl,
            buyer_id: order.buyer_id,
            amount: Number(order.total_amount),
            item_name: order.item_name || "Pesanan DX STORE",
            status: order.status,
            created_at: order.created_at,
            proof_url: proofUrl,
          };
        }));
        return json({ orders });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const adminMatch = path.match(/\/api\/admin\/orders\/([0-9a-f-]+)$/i);
  if (req.method === "PATCH" && adminMatch) {
    if (!await isAdmin(user!.id)) return json({ message: "Akses khusus admin." }, 403);
    const orderId = adminMatch[1];
    let decision = "";
    try { decision = (await req.json())?.status; } catch { /* invalid JSON */ }
    if (!isUuid(orderId) || !["paid", "rejected"].includes(decision)) return json({ message: "Perubahan status tidak valid." }, 400);
    const { data, error } = await adminClient.rpc("dx_review_order_and_listing", {
      p_order_id: orderId, p_decision: decision,
    });
    if (error || !data) {
      console.error("Review order RPC:", error?.message);
      const unavailable = error?.message?.includes("DX_ORDER_UNAVAILABLE");
      return json({ message: unavailable ? "Pesanan sudah diproses atau status barang berubah." : "Pesanan gagal diperbarui." }, 409);
    }
    return json({ order_id: data.id, status: data.status });
  }

  return json({ message: "Endpoint tidak ditemukan." }, 404);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  });