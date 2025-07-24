import { SendSmtpEmail, TransactionalEmailsApi } from "@getbrevo/brevo";

let apiInstance: TransactionalEmailsApi;

function configureApiInstance() {
    apiInstance = new TransactionalEmailsApi();
    (apiInstance as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY || '';
}

export async function sendPasswordResetEmail(email: string, code: string) {
    if (!apiInstance) {
        configureApiInstance();
    }
    const smtpEmail = new SendSmtpEmail();
    smtpEmail.templateId = 1;
    smtpEmail.to = [{ email: email }];
    smtpEmail.params = { RESET_CODE: code };
    try {
        await apiInstance.sendTransacEmail(smtpEmail);
        console.log('Password reset email sent successfully to user with email: ', email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}
