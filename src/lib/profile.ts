import { supabaseBrowser } from "@/lib/supabase-browser";

export type StudentProfile = {
  user_id: string;
  region?: string | null;
  district?: string | null;
  school?: string | null;
  school_code?: string | null;
  grade?: string | null;
  subject?: string | null;
  term?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type StudentProfileInput = {
  region?: string | null;
  district?: string | null;
  school?: string | null;
  school_code?: string | null;
  grade?: string | null;
  subject?: string | null;
  term?: string | null;
};

/**
 * 내 학생 프로필 조회
 * @param userId - 사용자 ID (옵션, 없으면 내부에서 getUser 호출)
 */
export async function getMyProfile(userId?: string): Promise<StudentProfile | null> {
  try {
    const supabase = supabaseBrowser();
    
    let finalUserId = userId;
    if (!finalUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }
      finalUserId = user.id;
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", finalUserId)
      .maybeSingle();

    if (error) {
      console.error("[getMyProfile] error:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("[getMyProfile] exception:", e);
    return null;
  }
}

/**
 * 내 학생 프로필 저장/업데이트
 * @param input - 프로필 입력 데이터
 * @param userId - 사용자 ID (필수)
 */
export async function upsertMyProfile(
  input: StudentProfileInput,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    const supabase = supabaseBrowser();

    const { error } = await supabase.from("student_profiles").upsert(
      {
        user_id: userId,
        ...input,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("[upsertMyProfile] error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("[upsertMyProfile] exception:", e);
    return { success: false, error: e?.message || "Unknown error" };
  }
}

/**
 * 프로필이 완성되었는지 확인 (핵심 필드 체크)
 */
export function isProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return !!(
    profile.school &&
    profile.grade &&
    profile.subject
  );
}

