import type { ApplicationStatus } from "../types";
import { AppConfig } from '../config.ts';

/**
 * @fileoverview Notification service for sending emails via a backend API.
 */

/**
 * Simulates sending an email by making a POST request to a backend endpoint.
 * In a real application, this endpoint would handle the actual email sending.
 * @param payload The email details.
 */
async function sendEmail(payload: { recipientEmail: string; subject: string; body: string; }) {
    try {
        // This simulates calling a backend API endpoint to send the email.
        // The backend would then use a service like SendGrid, SES, etc.
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // For demonstration purposes, we check the mock response.
        // In a real app, you might have more robust error handling or retry logic.
        if (!response.ok && response.status !== 404) { // Ignore 404 for simulation
            console.error(`API call to send email failed with status: ${response.status}`);
        }
        
        // We'll still log the simulated action for development visibility.
        console.log("--- SIMULATING EMAIL API CALL ---");
        console.log("Payload sent to /api/send-email:", payload);
        console.log("-------------------------------------");

    } catch (error) {
        // This would catch network errors, etc.
        console.error("Error calling the email sending API:", error);
    }
}


export const sendNewMessageEmail = async (
    recipientEmail: string,
    ticketSubject: string,
    messageText: string,
    senderName: string
): Promise<void> => {
    const subject = `[スマートポリス] 新着メッセージのお知らせ: ${ticketSubject}`;
    const body = `
${senderName}様から新しいメッセージが届きました。

---------------------------------------------------
メッセージ内容:

${messageText}
---------------------------------------------------

以下のURLからポータルにログインして内容をご確認ください。
${AppConfig.PUBLIC_URL}
    `.trim();

    await sendEmail({ recipientEmail, subject, body });
};

export const sendNewApplicationEmail = async (
    adminEmail: string,
    serviceName: string,
    clientName: string
): Promise<void> => {
    const subject = `[要対応] 新規サービス申込がありました`;
    const body = `
クライアント「${clientName}」様より、
サービス「${serviceName}」への新規申込がありました。

管理画面にログインし、申込内容の確認と承認作業を行ってください。
${AppConfig.PUBLIC_URL}
    `.trim();

    await sendEmail({ recipientEmail: adminEmail, subject, body });
};

export const sendApplicationStatusEmail = async (
    clientEmail: string,
    serviceName: string,
    status: ApplicationStatus
): Promise<void> => {
    const statusText = status === 'approved' ? '承認されました' : '却下されました';
    const subject = `[スマートポリス] サービス申込「${serviceName}」が${statusText}`;
    const bodyContent = status === 'approved' 
        ? `先日お申し込みいただいたサービス「${serviceName}」が承認され、利用可能となりました。\n請求書が発行されておりますので、ポータルサイトよりご確認ください。`
        : `誠に残念ながら、お申し込みいただいたサービス「${serviceName}」は見送らせていただくこととなりました。\n詳細につきましては担当者よりご連絡いたします。`;

    const body = `
${bodyContent}

以下のURLからポータルにログインして詳細をご確認ください。
${AppConfig.PUBLIC_URL}
    `.trim();

    await sendEmail({ recipientEmail: clientEmail, subject, body });
};
