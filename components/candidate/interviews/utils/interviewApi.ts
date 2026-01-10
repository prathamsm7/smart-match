import { ChatMessage, InterviewReport } from "../types";

/**
 * Persist conversation transcript to the interview conversation API.
 */
export async function persistConversationApi(
  interviewId: string,
  chat: ChatMessage[],
  stage: "snapshot" | "final",
): Promise<void> {
  await fetch("/api/interview/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interviewId,
      chat,
      stage,
    }),
  });
}

/**
 * Request interview report generation.
 */
export async function requestInterviewReport(
  interviewId: string,
): Promise<{ report: InterviewReport; role: string }> {
  const res = await fetch("/api/interview/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Report generation failed");
  }

  const data = await res.json();
  const payload = data?.report;
  const role = data?.role || "candidate";

  if (!payload) {
    throw new Error("Report payload is missing.");
  }

  if (typeof payload === "string") {
    try {
      return { report: JSON.parse(payload) as InterviewReport, role };
    } catch {
      throw new Error("Received malformed report payload.");
    }
  }

  if (typeof payload === "object") {
    return { report: payload as InterviewReport, role };
  }

  throw new Error("Unexpected report payload format.");
}

