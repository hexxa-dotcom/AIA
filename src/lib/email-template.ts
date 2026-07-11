/**
 * Templates de email para notificações de vencimento e atribuição.
 * Use com Resend (https://resend.com).
 *
 * Para ativar:
 *  1) npm install resend
 *  2) Coloque RESEND_API_KEY e RESEND_FROM_EMAIL no .env.local
 *  3) Substitua o stub em src/app/api/email/send/route.ts
 */

export function dueSoonEmail(opts: {
  taskTitle: string;
  dueDate: Date;
  appUrl: string;
}) {
  const due = opts.dueDate.toLocaleString("pt-BR");
  return {
    subject: `Sua tarefa"${opts.taskTitle}"está vencendo`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <div style="background: #d6d6d2; border-radius: 28px; padding: 32px; text-align: center;">
          <div style="font-size: 48px;"></div>
          <h1 style="margin: 12px 0; font-size: 22px;">A tarefa está vencendo</h1>
          <p style="color: #5b5a55; margin: 0 0 24px;">
"<strong>${opts.taskTitle}</strong>"vence em <strong>${due}</strong>.
          </p>
          <a href="${opts.appUrl}"style="display: inline-block; background: #1a1a1a; color: #f5f5f3; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">
            Abrir no AIA OS
          </a>
        </div>
        <p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">
          AIA OS — você está recebendo esta notificação porque ativou alertas de vencimento.
        </p>
      </div>
`,
  };
}

export function assignedEmail(opts: {
  taskTitle: string;
  assignerName: string;
  appUrl: string;
}) {
  return {
    subject: `Você foi atribuído à tarefa"${opts.taskTitle}"`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <div style="background: #f5f5f3; border-radius: 28px; padding: 32px; text-align: center;">
          <div style="font-size: 48px;"></div>
          <h1 style="margin: 12px 0; font-size: 22px;">Nova tarefa pra você</h1>
          <p style="color: #1a1a1a; margin: 0 0 24px;">
            <strong>${opts.assignerName}</strong> te atribuiu à tarefa"<strong>${opts.taskTitle}</strong>".
          </p>
          <a href="${opts.appUrl}"style="display: inline-block; background: #1a1a1a; color: #f5f5f3; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">
            Ver tarefa
          </a>
        </div>
      </div>
`,
  };
}
