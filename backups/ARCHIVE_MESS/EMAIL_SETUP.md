# Konfiguracja Email Notifications

## Zmienne Środowiskowe

Dodaj poniższe zmienne do `.env.local`:

```env
# SMTP Configuration (Email Sender)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=noreply@wlasniewski.pl

# App URL
NEXT_PUBLIC_APP_URL=https://wlasniewski.pl
```

## Dostawcy SMTP

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**Uwaga:** W Gmail musisz wygenerować [hasło aplikacji](https://myaccount.google.com/apppasswords)

### Office 365 / Outlook
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key
```

### Brevo (bywałem Sendinblue)
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-brevo-api-key
```

## Integrowane Emaile

### 1. Challenge Invitation (`challenge-invitation`)
- **Wysyłana do:** Osoby zapraszanej
- **Trigger:** Po kliknięciu "Utwórz wyzwanie" przez zapraszającego
- **Zawiera:** Dane zapraszającego, szczegóły pakietu, link do zaproszenia

### 2. Challenge Accepted (`challenge-accepted`)
- **Wysyłana do:** Osoby zapraszanej
- **Trigger:** Po zaakceptowaniu wyzwania i wyborze daty/godziny
- **Zawiera:** Szczegóły sesji, datę, godzinę, lokalizację, link do galerii

## Testowanie

```bash
# Zainstaluj nodemailer (jeśli nie zainstalowany)
npm install nodemailer

# Testowy skrypt
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password'
  }
});

transporter.sendMail({
  from: 'test@example.com',
  to: 'recipient@example.com',
  subject: 'Test',
  html: '<h1>Test email</h1>'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Email sent:', info.response);
});
"
```

## Troubleshooting

### "SMTP connection timeout"
- Sprawdź host i port
- Upewnij się, że port jest otwarty w firewall'u
- Spróbuj innego portu (np. 465 zamiast 587)

### "Invalid login credentials"
- Sprawdź czy password/API key jest poprawny
- W Gmailu użyj app-specific password
- Upewnij się, że masz 2FA wyłączone dla SMTP

### Emaile nie są wysyłane
- Sprawdź logs: `console.error('Email send error:', error)`
- Upewnij się że zmienne env są załadowane
- Spróbuj testować z testowego adresu

## W Produkcji

Dla produkcji (Netlify/Railway):
1. Dodaj zmienne env w panelu dostawcy
2. Upewnij się że `NEXT_PUBLIC_APP_URL` jest ustawiony na domenę produkcji
3. Testuj wysyłanie emaili przed deployem
4. Monitoruj error logs na backend'zie

## Rozszerzanie Szablonów

Aby dodać nowy email, edytuj [`src/lib/email/sender.ts`](../../../lib/email/sender.ts):

```typescript
'new-template-name': (d) => `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                // CSS tutaj
            </style>
        </head>
        <body>
            <h1>${d.customField}</h1>
            // HTML tutaj
        </body>
    </html>
`
```

Następnie użyj:
```typescript
await sendEmail({
    to: email,
    subject: 'Subject',
    template: 'new-template-name',
    data: { customField: 'value' }
});
```
