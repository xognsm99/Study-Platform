"use client";

import { useState } from "react";
import type { StudentProfile } from "@/lib/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type StudentProfileCardProps = {
  profile: StudentProfile;
  onEdit: () => void;
};

export default function StudentProfileCard({
  profile,
  onEdit,
}: StudentProfileCardProps) {
  const formatLocation = () => {
    const parts: string[] = [];
    if (profile.region) parts.push(profile.region);
    if (profile.district) parts.push(profile.district);
    return parts.join(" · ");
  };

  const formatInfo = () => {
    const parts: string[] = [];
    if (profile.grade) {
      const gradeLabel = profile.grade === "1" ? "중1" : profile.grade === "2" ? "중2" : profile.grade === "3" ? "중3" : `중${profile.grade}`;
      parts.push(gradeLabel);
    }
    if (profile.subject) parts.push(profile.subject);
    if (profile.term) parts.push(profile.term);
    return parts.join(" · ");
  };

  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {profile.school && (
              <div className="text-base font-semibold text-neutral-900">
                {profile.school}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              {formatLocation() && (
                <>
                  <span>{formatLocation()}</span>
                  {profile.school && <span>·</span>}
                </>
              )}
              {formatInfo() && <span>{formatInfo()}</span>}
            </div>
          </div>
          <Button
            onClick={onEdit}
            variant="outline"
            className="shrink-0 text-sm h-9 px-4"
          >
            수정
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

