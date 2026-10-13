export type Finding = {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  legal_reference: string;
  evidence: string;
  recommendation: string;
};

export type AssessmentSnapshot = {
  overall_risk: "low" | "medium" | "high" | "critical";
  compliance_score: number;
  findings: Finding[];
  strengths: string[];
  summary: string;
  disclaimer: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  messageType: "chat" | "assessment";
  assessmentSnapshot: AssessmentSnapshot | null;
  attachments: string[];
  createdAt: string;
};

export type SessionDocumentMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  order: number;
  uploadedAt: string;
};

export type UserDocument = SessionDocumentMeta & {
  sessionId: string;
  sessionTitle: string;
};

export type ChatSession = {
  id: string;
  title: string;
  contextSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionDetail = {
  session: ChatSession;
  messages: ChatMessage[];
  documents: SessionDocumentMeta[];
};

export type SessionListItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};
