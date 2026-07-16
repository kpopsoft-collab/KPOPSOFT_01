export type InvoiceEmailItem = {
  productName: string;
  description: string;
  quantity: number;
  unitSupplyAmount: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  sortOrder: number;
};

export type InvoiceEmailInput = {
  customerName: string;
  siteName: string;
  siteOrigin: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  items: InvoiceEmailItem[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function won(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

export function buildInvoiceEmail(input: InvoiceEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `[KPOPSOFT] 청구서 ${input.invoiceNumber} 승인 안내`;
  const itemLines = input.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(
      (item) =>
        `- ${item.productName}${item.description ? ` (${item.description})` : ""}: ${item.quantity}개, ${won(item.totalAmount)}`,
    );
  const text = [
    `${input.customerName} 담당자님, KPOPSOFT 청구서가 승인되었습니다.`,
    "",
    `청구번호: ${input.invoiceNumber}`,
    `대상 사이트: ${input.siteName}`,
    `청구기간: ${input.periodStart} ~ ${input.periodEnd}`,
    `발행일: ${input.issueDate}`,
    `납부기한: ${input.dueDate}`,
    `공급가액: ${won(input.supplyAmount)}`,
    `부가세: ${won(input.vatAmount)}`,
    `합계: ${won(input.totalAmount)}`,
    "",
    "청구 항목",
    ...itemLines,
    "",
    "결제 상태와 결제 버튼은 아래 고객사 관리사이트에 로그인해 확인해 주세요.",
    `관리사이트: ${input.siteOrigin}`,
    "",
    "이 메일에는 직접 결제 링크가 포함되어 있지 않습니다.",
  ].join("\n");

  const itemRows = input.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.productName)}</td>
        <td>${escapeHtml(item.description)}</td>
        <td>${item.quantity}</td>
        <td>${escapeHtml(won(item.totalAmount))}</td>
      </tr>`,
    )
    .join("");
  const html = `<main>
    <p>${escapeHtml(input.customerName)} 담당자님, KPOPSOFT 청구서가 승인되었습니다.</p>
    <dl>
      <dt>청구번호</dt><dd>${escapeHtml(input.invoiceNumber)}</dd>
      <dt>대상 사이트</dt><dd>${escapeHtml(input.siteName)}</dd>
      <dt>청구기간</dt><dd>${escapeHtml(input.periodStart)} ~ ${escapeHtml(input.periodEnd)}</dd>
      <dt>발행일</dt><dd>${escapeHtml(input.issueDate)}</dd>
      <dt>납부기한</dt><dd>${escapeHtml(input.dueDate)}</dd>
      <dt>공급가액</dt><dd>${escapeHtml(won(input.supplyAmount))}</dd>
      <dt>부가세</dt><dd>${escapeHtml(won(input.vatAmount))}</dd>
      <dt>합계</dt><dd><strong>${escapeHtml(won(input.totalAmount))}</strong></dd>
    </dl>
    <table>
      <thead><tr><th>항목</th><th>설명</th><th>수량</th><th>금액</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <p>결제 상태와 결제 버튼은 고객사 관리사이트에 로그인해 확인해 주세요.</p>
    <p><a href="${escapeHtml(input.siteOrigin)}">${escapeHtml(input.siteOrigin)}</a></p>
    <p>이 메일에는 직접 결제 링크가 포함되어 있지 않습니다.</p>
  </main>`;

  return { subject, text, html };
}
