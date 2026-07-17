import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 2525,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
});

class EmailService {
    async sendAccepted(toEmail: string, firstName: string, organizationName: string) {
        try {
            const info = await transporter.sendMail({
                from: `"AsistApp" <asistapp@hotmail.com>`,
                to: toEmail,
                subject: "¡Fuiste aceptado en AsistApp!",
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f6f7f8; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #ff6a00, #e15d27); padding: 40px 32px; text-align: center;">
                            <div style="width: 64px; height: 64px; line-height: 64px; text-align: center; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px;">
                                <span style="font-size: 32px; vertical-align: middle;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">¡Solicitud aprobada!</h1>
                        </div>
                        <div style="padding: 32px; background: #ffffff;">
                            <p style="color: #242424; font-size: 16px; margin: 0 0 12px;">Hola, <strong>${firstName}</strong> 👋</p>
                            <p style="color: #717182; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Tu solicitud para unirte a <strong style="color: #ff6a00;">${organizationName}</strong> ha sido <strong style="color: #16a34a;">aceptada</strong>. Ya formas parte del equipo.
                            </p>
                            <div style="background: #ffddcc; border-left: 4px solid #ff6a00; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
                                <p style="margin: 0; color: #5c1900; font-size: 14px;">
                                    Ya puedes iniciar sesión en <strong>AsistApp</strong> y comenzar a registrar tu asistencia.
                                </p>
                            </div>
                            <p style="color: #717182; font-size: 13px; margin: 0; text-align: center;">
                                Si tienes alguna duda, comunícate con el administrador de tu organización.
                            </p>
                        </div>
                        <div style="background: #ececf0; padding: 16px; text-align: center;">
                            <p style="color: #717182; font-size: 12px; margin: 0;">© 2026 AsistApp · Este correo fue enviado automáticamente</p>
                        </div>
                    </div>
                `,
            });
            console.log("[EmailService] Correo de aceptación enviado a:", toEmail, "| messageId:", info.messageId);
        } catch (error) {
            console.error("[EmailService] Error al enviar correo de aceptación:", error);
        }
    }

    async sendScheduleApproved(toEmail: string, firstName: string) {
        try {
            const info = await transporter.sendMail({
                from: `"AsistApp" <asistapp@hotmail.com>`,
                to: toEmail,
                subject: "Tu horario fue aprobado",
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f6f7f8; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #ff6a00, #e15d27); padding: 40px 32px; text-align: center;">
                            <div style="width: 64px; height: 64px; line-height: 64px; text-align: center; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px;">
                                <span style="font-size: 32px; vertical-align: middle;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">¡Horario aprobado!</h1>
                        </div>
                        <div style="padding: 32px; background: #ffffff;">
                            <p style="color: #242424; font-size: 16px; margin: 0 0 12px;">Hola, <strong>${firstName}</strong> 👋</p>
                            <p style="color: #717182; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Tu horario fue <strong style="color: #16a34a;">aprobado</strong> por tu jefe. Ya está activo.
                            </p>
                            <div style="background: #ffddcc; border-left: 4px solid #ff6a00; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
                                <p style="margin: 0; color: #5c1900; font-size: 14px;">
                                    Ya puedes registrar tu asistencia en <strong>AsistApp</strong> con normalidad.
                                </p>
                            </div>
                            <p style="color: #717182; font-size: 13px; margin: 0; text-align: center;">
                                Si tienes alguna duda, comunícate con el administrador de tu organización.
                            </p>
                        </div>
                        <div style="background: #ececf0; padding: 16px; text-align: center;">
                            <p style="color: #717182; font-size: 12px; margin: 0;">© 2026 AsistApp · Este correo fue enviado automáticamente</p>
                        </div>
                    </div>
                `,
            });
            console.log("[EmailService] Correo de horario aprobado enviado a:", toEmail, "| messageId:", info.messageId);
        } catch (error) {
            console.error("[EmailService] Error al enviar correo de horario aprobado:", error);
        }
    }

    async sendScheduleRejected(toEmail: string, firstName: string) {
        try {
            await transporter.sendMail({
                from: `"AsistApp" <asistapp@hotmail.com>`,
                to: toEmail,
                subject: "Tu horario fue rechazado",
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f6f7f8; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #d4183d, #9f273d); padding: 40px 32px; text-align: center;">
                            <div style="width: 64px; height: 64px; line-height: 64px; text-align: center; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px;">
                                <span style="font-size: 32px; vertical-align: middle;">✕</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Horario rechazado</h1>
                        </div>
                        <div style="padding: 32px; background: #ffffff;">
                            <p style="color: #242424; font-size: 16px; margin: 0 0 12px;">Hola, <strong>${firstName}</strong></p>
                            <p style="color: #717182; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Tu propuesta de horario fue <strong style="color: #d4183d;">rechazada</strong> por tu jefe.
                            </p>
                            <div style="background: #ffd9df; border-left: 4px solid #d4183d; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
                                <p style="margin: 0; color: #5f0014; font-size: 14px;">
                                    Ingresa a <strong>AsistApp</strong> para configurar un nuevo horario.
                                </p>
                            </div>
                            <p style="color: #717182; font-size: 13px; margin: 0; text-align: center;">
                                Si crees que esto es un error, contacta al administrador de tu organización.
                            </p>
                        </div>
                        <div style="background: #ececf0; padding: 16px; text-align: center;">
                            <p style="color: #717182; font-size: 12px; margin: 0;">© 2026 AsistApp · Este correo fue enviado automáticamente</p>
                        </div>
                    </div>
                `,
            });
        } catch (error) {
            console.error("[EmailService] Error al enviar correo de horario rechazado:", error);
        }
    }

    async sendRejected(toEmail: string, firstName: string, organizationName: string) {
        try {
            await transporter.sendMail({
                from: `"AsistApp" <asistapp@hotmail.com>`,
                to: toEmail,
                subject: "Tu solicitud en AsistApp fue rechazada",
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f6f7f8; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #d4183d, #9f273d); padding: 40px 32px; text-align: center;">
                            <div style="width: 64px; height: 64px; line-height: 64px; text-align: center; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px;">
                                <span style="font-size: 32px; vertical-align: middle;">✕</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Solicitud rechazada</h1>
                        </div>
                        <div style="padding: 32px; background: #ffffff;">
                            <p style="color: #242424; font-size: 16px; margin: 0 0 12px;">Hola, <strong>${firstName}</strong></p>
                            <p style="color: #717182; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Tu solicitud para unirte a <strong style="color: #ff6a00;">${organizationName}</strong> ha sido <strong style="color: #d4183d;">rechazada</strong> por el administrador.
                            </p>
                            <div style="background: #ffd9df; border-left: 4px solid #d4183d; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
                                <p style="margin: 0; color: #5f0014; font-size: 14px;">
                                    Puedes intentar unirte a otra organización ingresando un nuevo código, o comunicarte directamente con el administrador.
                                </p>
                            </div>
                            <p style="color: #717182; font-size: 13px; margin: 0; text-align: center;">
                                Si crees que esto es un error, contacta al administrador de tu organización.
                            </p>
                        </div>
                        <div style="background: #ececf0; padding: 16px; text-align: center;">
                            <p style="color: #717182; font-size: 12px; margin: 0;">© 2026 AsistApp · Este correo fue enviado automáticamente</p>
                        </div>
                    </div>
                `,
            });
        } catch (error) {
            console.error("[EmailService] Error al enviar correo de rechazo:", error);
        }
    }
}

export default new EmailService();
