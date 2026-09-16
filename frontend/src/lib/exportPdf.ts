import jsPDF from "jspdf";

export interface UserExportData {
  export_metadata?: {
    exported_at?: string;
    application?: string;
    version?: string;
  };
  user_profile?: {
    id?: string;
    name?: string | null;
    email?: string;
    created_at?: string | null;
    role?: string;
  };
  preferences?: Record<string, any>;
  conversations?: Array<{
    id: string;
    title?: string | null;
    created_at?: string | null;
    messages?: Array<{
      id: string;
      role: string;
      content: string;
      created_at?: string | null;
    }>;
  }>;
  memories?: Array<{
    id: string;
    type: string;
    summary?: string | null;
    content: string;
    importance?: number;
    created_at?: string | null;
  }>;
}

export async function exportUserDataAsPdf(data: UserExportData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 16;

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
  };

  // Header Banner Background
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(marginX, currentY, contentWidth, 22, "F");

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GitaMitra - Spiritual Data Archive", marginX + 6, currentY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Sacred Sadhana, Dialogue History & Spiritual Memory Export",
    marginX + 6,
    currentY + 16
  );

  currentY += 28;

  // Metadata Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, contentWidth, 32, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("Seeker Profile & Export Metadata", marginX + 5, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  const devoteeName = data.user_profile?.name || "Spiritual Seeker";
  const devoteeEmail = data.user_profile?.email || "N/A";
  const exportedAt = data.export_metadata?.exported_at
    ? new Date(data.export_metadata.exported_at).toLocaleString()
    : new Date().toLocaleString();
  const memberSince = data.user_profile?.created_at
    ? new Date(data.user_profile.created_at).toLocaleDateString()
    : "N/A";

  doc.text(`Devotee: ${devoteeName}`, marginX + 5, currentY + 14);
  doc.text(`Email: ${devoteeEmail}`, marginX + 5, currentY + 20);
  doc.text(`Member Since: ${memberSince}`, marginX + 5, currentY + 26);

  const col2X = marginX + contentWidth / 2 + 5;
  doc.text(`Export Date: ${exportedAt}`, col2X, currentY + 14);
  doc.text(`Status: Sadhaka (Active)`, col2X, currentY + 20);
  doc.text(`Application: GitaMitra Companion v1.0`, col2X, currentY + 26);

  currentY += 38;

  // Section: Spiritual Memories
  ensureSpace(20);
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9); // amber-700
  const memCount = data.memories ? data.memories.length : 0;
  doc.text(`Spiritual Memories & Realizations (${memCount})`, marginX + 4, currentY + 5.5);

  currentY += 12;

  if (!data.memories || data.memories.length === 0) {
    ensureSpace(12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("No active spiritual memories recorded yet.", marginX + 5, currentY + 4);
    currentY += 10;
  } else {
    for (const mem of data.memories) {
      const summaryText = mem.summary || "General Realization";
      const typeText = `Type: ${mem.type || "PROFILE"}`;
      const importanceText = `Importance: ${mem.importance ?? 3}/5`;
      const dateText = mem.created_at ? new Date(mem.created_at).toLocaleDateString() : "";

      const contentLines = doc.splitTextToSize(mem.content, contentWidth - 10);
      const cardHeight = 16 + contentLines.length * 4.2;

      ensureSpace(cardHeight + 4);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 2, 2, "FD");

      // Card Accent Left Bar
      doc.setFillColor(217, 119, 6);
      doc.rect(marginX, currentY, 2, cardHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(summaryText, marginX + 5, currentY + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${typeText}  |  ${importanceText}  ${dateText ? ` |  ${dateText}` : ""}`, marginX + 5, currentY + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(contentLines, marginX + 5, currentY + 15);

      currentY += cardHeight + 4;
    }
  }

  currentY += 4;

  // Section: Spiritual Conversations
  ensureSpace(20);
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  const convCount = data.conversations ? data.conversations.length : 0;
  doc.text(`Spiritual Dialogue Archives (${convCount} Conversations)`, marginX + 4, currentY + 5.5);

  currentY += 12;

  if (!data.conversations || data.conversations.length === 0) {
    ensureSpace(12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("No conversation history found.", marginX + 5, currentY + 4);
    currentY += 10;
  } else {
    for (const conv of data.conversations) {
      const convTitle = conv.title || "Spiritual Inquiry";
      const convDate = conv.created_at ? new Date(conv.created_at).toLocaleString() : "";
      const msgCount = conv.messages ? conv.messages.length : 0;

      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Conversation: ${convTitle}`, marginX + 2, currentY + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Messages: ${msgCount} ${convDate ? ` | Started: ${convDate}` : ""}`, marginX + 2, currentY + 8.5);

      currentY += 11;

      if (conv.messages && conv.messages.length > 0) {
        for (const msg of conv.messages) {
          const isUser = msg.role === "user";
          const speaker = isUser ? (devoteeName || "Seeker") : "GitaMitra (Krishna)";
          const speakerColor = isUser ? [180, 83, 9] : [13, 148, 136]; // amber-700 or teal-600

          const textLines = doc.splitTextToSize(msg.content, contentWidth - 14);
          const msgHeight = 9 + textLines.length * 4;

          ensureSpace(msgHeight + 3);

          doc.setFillColor(isUser ? 254 : 240, isUser ? 252 : 253, isUser ? 245 : 250);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(marginX + 2, currentY, contentWidth - 4, msgHeight, 2, 2, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(speakerColor[0], speakerColor[1], speakerColor[2]);
          doc.text(speaker, marginX + 5, currentY + 4.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text(textLines, marginX + 5, currentY + 8.5);

          currentY += msgHeight + 3;
        }
      }
      currentY += 4;
    }
  }

  // Add Page Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "GitaMitra Sanctuary — Encrypted, Private, & Sacred Devotional Companion",
      marginX,
      pageHeight - 9
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX - 18, pageHeight - 9);
  }

  const safeName = (devoteeName || "seeker").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`gitamitra_data_export_${safeName}.pdf`);
}
