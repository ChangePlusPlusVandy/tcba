interface AlertEmailParams {
  to: string;
  organizationName: string;
  alertTitle: string;
  alertContent: string;
  alertPriority: 'URGENT' | 'MEDIUM' | 'LOW';
  attachmentUrls?: string[];
}

export class EmailService {
  static async sendAlertEmail(params: AlertEmailParams): Promise<void> {
    const { to, organizationName, alertTitle, alertContent, alertPriority, attachmentUrls } =
      params;

    console.log('[EmailService] Sending alert email:', {
      to,
      organizationName,
      subject: `[${alertPriority}] ${alertTitle}`,
      content: alertContent,
      attachments: attachmentUrls,
    });
  }
}
