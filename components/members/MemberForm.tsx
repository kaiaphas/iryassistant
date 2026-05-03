"use client";

import type { AdminUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";

export function MemberForm({ member, open, onOpenChange }: { member?: AdminUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="회원 정보 수정">
      <div className="space-y-3">
        <Input defaultValue={member?.name} placeholder="이름" />
        <Input defaultValue={member?.loginId} placeholder="아이디" />
        <Input type="password" placeholder="비밀번호" />
        <Select defaultValue={member?.role || "일반사용자"}>
          <option>최고관리자</option>
          <option>예약담당자</option>
          <option>배차담당자</option>
          <option>가이드담당자</option>
          <option>회계담당자</option>
          <option>일반사용자</option>
        </Select>
        <Input defaultValue={member?.department} placeholder="소속" />
        <Input defaultValue={member?.phone} placeholder="연락처" />
        <Input defaultValue={member?.email} placeholder="이메일" />
        <Select defaultValue={member?.status || "active"}>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </Select>
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" placeholder="메모" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
