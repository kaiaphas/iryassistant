"use client";

import * as React from "react";
import type { AdminUser } from "@/lib/types";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberForm } from "@/components/members/MemberForm";

export function MemberTable({ members }: { members: AdminUser[] }) {
  const [items, setItems] = React.useState(members);
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [selected, setSelected] = React.useState<AdminUser | undefined>();
  const [open, setOpen] = React.useState(false);

  const filtered = items.filter((member) => {
    const q = query.toLowerCase();
    return (!q || [member.name, member.loginId, member.phone, member.email].some((value) => value?.toLowerCase().includes(q)))
      && (!role || member.role === role)
      && (!status || member.status === status);
  });

  function edit(member?: AdminUser) {
    setSelected(member);
    setOpen(true);
  }

  async function approve(member: AdminUser) {
    const response = await fetch("/api/members/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, role: member.role || "담당자" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload.message ?? "회원 승인에 실패했습니다.");
      return;
    }
    setItems((current) => current.map((item) => item.id === payload.id ? payload : item));
  }

  function handleSaved(member: AdminUser) {
    setItems((current) => current.map((item) => item.id === member.id ? member : item));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_180px_auto]">
        <SearchInput placeholder="이름, 아이디, 연락처 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">권한 전체</option>
          <option>관리자</option>
          <option>담당자</option>
          <option>최고관리자</option>
          <option>예약담당자</option>
          <option>차량담당자</option>
          <option>가이드담당자</option>
          <option>회계담당자</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">상태 전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="pending">승인대기</option>
        </Select>
        <Button onClick={() => edit()}>+ 신규 등록</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                {["회원ID", "이름", "아이디", "권한", "소속", "연락처", "이메일", "상태", "마지막 로그인", "가입일", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.id}</TableCell>
                  <TableCell className="font-semibold">{member.name}</TableCell>
                  <TableCell>{member.loginId}</TableCell>
                  <TableCell><StatusBadge value={member.role} /></TableCell>
                  <TableCell>{member.department || "-"}</TableCell>
                  <TableCell>{member.phone || "-"}</TableCell>
                  <TableCell>{member.email || "-"}</TableCell>
                  <TableCell><StatusBadge value={member.status === "active" ? "활성" : member.status === "pending" ? "승인대기" : "비활성"} /></TableCell>
                  <TableCell>{member.lastLoginAt || "-"}</TableCell>
                  <TableCell>{member.createdAt}</TableCell>
                  <TableCell className="space-x-2">
                    {member.status === "pending" ? <Button size="sm" onClick={() => approve(member)}>승인</Button> : null}
                    <Button size="sm" variant="outline" onClick={() => edit(member)}>수정</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <MemberForm member={selected} open={open} onOpenChange={setOpen} onSaved={handleSaved} />
    </div>
  );
}
