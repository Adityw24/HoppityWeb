// ── Avatar storage config ────────────────────────────────────────────────
// These MUST match exactly what's in Supabase Dashboard → Storage.
// Case-sensitive. The BUCKET goes in .from(), the FOLDER goes in the path.
//
//   supabase.storage.from(AVATAR_BUCKET).upload(avatarPath(uid), blob)
//   → object lands at:  user/profilepic/<uid>.jpg
//                       ^bucket ^folder
export const AVATAR_BUCKET = 'user'
export const AVATAR_FOLDER = 'profilepic'

export const avatarPath = (userId) => `${AVATAR_FOLDER}/${userId}.jpg`