export type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const buildEmailTemplate = (subject: string, body: string): EmailTemplateResult => {
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");
  return {
    subject,
    text: body,
    html: `
      <div style="font-family: Manrope, Arial, sans-serif; background:#fffaf4; padding:28px; color:#25212b;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid rgba(80,61,52,.14); border-radius:24px; overflow:hidden;">
          <div style="padding:24px 28px; background:#25212b; color:#fff7ef;">
            <div style="font-size:12px; font-weight:800; letter-spacing:1.4px; color:#f36f56;">LOAN TRACKER</div>
            <h1 style="margin:8px 0 0; font-size:24px; line-height:1.2;">${escapeHtml(subject)}</h1>
          </div>
          <div style="padding:28px; font-size:15px; line-height:1.75;">${safeBody}</div>
          <div style="padding:18px 28px; border-top:1px solid rgba(80,61,52,.12); color:#6f6577; font-size:12px;">
            This email was generated from Loan Tracker records.
          </div>
        </div>
      </div>
    `,
  };
};
