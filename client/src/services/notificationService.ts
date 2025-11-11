import type { ApplicationStatus } from "../types";

/**
 * @fileoverview Notification service for sending emails (simulated).
 */

export const sendNewMessageEmail = (
    recipientEmail: string,
    ticketSubject: string,
    messageText: string,
    senderName: string
): void => {
    const emailBody = `
    ===================================================
    |            スマートポリス通知システム             |
    ===================================================

    宛先: ${recipientEmail}

    件名: [スマートポリス] 新着メッセージのお知らせ: ${ticketSubject}

    ${senderName}様から新しいメッセージが届きました。

    ---------------------------------------------------
    メッセージ内容:
    
    ${messageText}
    ---------------------------------------------------

    ポータルにログインして内容をご確認ください。
    `;

    console.log("--- SIMULATING EMAIL NOTIFICATION (New Message) ---");
    console.log(emailBody.trim());
    console.log("-------------------------------------");
};

export const sendNewApplicationEmail = (
    adminEmail: string,
    serviceName: string,
    clientName: string
): void => {
     const emailBody = `
    ===================================================
    |            スマートポリス通知システム             |
    ===================================================

    宛先: ${adminEmail} (管理者)

    件名: [要対応] 新規サービス申込がありました

    クライアント「${clientName}」様より、
    サービス「${serviceName}」への新規申込がありました。

    管理画面にログインし、申込内容の確認と承認作業を行ってください。
    `;
    console.log("--- SIMULATING EMAIL NOTIFICATION (New Application) ---");
    console.log(emailBody.trim());
    console.log("-------------------------------------");
};

export const sendApplicationStatusEmail = (
    clientEmail: string,
    serviceName: string,
    status: ApplicationStatus
): void => {
    const statusText = status === 'approved' ? '承認されました' : '却下されました';
    const subject = `[スマートポリス] サービス申込「${serviceName}」が${statusText}`;
    const bodyText = status === 'approved' 
        ? `先日お申し込みいただいたサービス「${serviceName}」が承認され、利用可能となりました。\n請求書が発行されておりますので、ポータルサイトよりご確認ください。`
        : `誠に残念ながら、お申し込みいただいたサービス「${serviceName}」は見送らせていただくこととなりました。\n詳細につきましては担当者よりご連絡いたします。`;

    const emailBody = `
    ===================================================
    |            スマートポリス通知システム             |
    ===================================================

    宛先: ${clientEmail}

    件名: ${subject}

    ${bodyText}

    ポータルにログインして詳細をご確認ください。
    `;
    console.log("--- SIMULATING EMAIL NOTIFICATION (Application Status) ---");
    console.log(emailBody.trim());
    console.log("-------------------------------------");
};