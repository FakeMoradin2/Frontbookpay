import { supabase } from "@/lib/supabaseClient";
import { ensureSupabaseSession } from "@/lib/supabase-session";

export const BUSINESS_ASSETS_BUCKET = "business-assets";

const MAX_BYTES = 5 * 1024 * 1024;

function toStorageUserError(message: string): Error {
  const m = message.toLowerCase();
  if (m.includes("bucket not found")) {
    return new Error(
      `Storage bucket "${BUSINESS_ASSETS_BUCKET}" does not exist yet. In Supabase: Storage → New bucket → name "${BUSINESS_ASSETS_BUCKET}" → enable Public → Create. Then run the SQL in sql/2026-04-14-supabase-storage-business-assets.sql (policies).`
    );
  }
  if (m.includes("new row violates row-level security") || m.includes("permission denied")) {
    return new Error(
      "Upload blocked by Storage policies. Run sql/2026-04-14-supabase-storage-business-assets.sql in the Supabase SQL editor."
    );
  }
  return new Error(message);
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function assertImage(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use JPG, PNG, WebP or GIF");
  }
}

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

/**
 * Sube imagen del negocio. Ruta: {negocioId}/negocio-{timestamp}.{ext}
 */
export async function uploadNegocioImage(negocioId: string, file: File): Promise<string> {
  assertImage(file);
  const ok = await ensureSupabaseSession();
  if (!ok) throw new Error("No Supabase session. Sign out and sign in again.");

  const ext = extFromFile(file);
  const path = `${negocioId}/negocio-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) throw toStorageUserError(error.message);

  const { data } = supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sube imagen de un servicio (edición: mismo id en ruta).
 * Ruta: {negocioId}/servicios/{servicioId}-{timestamp}.{ext}
 */
export async function uploadServicioImage(
  negocioId: string,
  servicioId: string,
  file: File
): Promise<string> {
  assertImage(file);
  const ok = await ensureSupabaseSession();
  if (!ok) throw new Error("No Supabase session. Sign out and sign in again.");

  const ext = extFromFile(file);
  const path = `${negocioId}/servicios/${servicioId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || `image/${ext}` });

  if (error) throw toStorageUserError(error.message);

  const { data } = supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Imagen al crear un servicio (aún no hay id de fila).
 * Ruta: {negocioId}/servicios/nuevo-{uuid}.{ext}
 */
export async function uploadNewServicioImage(negocioId: string, file: File): Promise<string> {
  assertImage(file);
  const ok = await ensureSupabaseSession();
  if (!ok) throw new Error("No Supabase session. Sign out and sign in again.");

  const ext = extFromFile(file);
  const path = `${negocioId}/servicios/nuevo-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || `image/${ext}` });

  if (error) throw toStorageUserError(error.message);

  const { data } = supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
