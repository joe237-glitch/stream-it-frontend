# STREAM-IT — Notes techniques (mise à jour continue)

## Architecture générale

| Élément | Détail |
|---------|--------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express + PostgreSQL |
| Paiement | Soleas Pay V3 (push Mobile Money) |
| Email | Resend (noreply@stream-it.shop) |
| Hébergement | Render (staging) |
| Domaine | stream-it.shop |

---

## RÈGLE ABSOLUE — Branches Git

| Repo | Branche déployée sur Render | Branche de travail |
|------|-----------------------------|--------------------|
| stream-it-backend | staging | staging uniquement |
| stream-it-frontend | staging | staging uniquement |

JAMAIS travailler sur master ou main — ces branches ne sont PAS déployées.
Render suit exclusivement la branche staging.

---

## Soleas Pay V3 — API exacte

### Endpoint push (déclenche notification téléphone)
POST https://soleaspay.com/api/agent/bills/v3
Headers: x-api-key, service (ID numérique), operation: "2"
Body: { orderId (camelCase!), wallet, amount, currency, description, payer, payerEmail, successUrl, failureUrl }

### Webhook reçu de SoleasPay
{ success, status: "SUCCESS"|"RECEIVED"|"REFUND", data: { reference, external_reference (=notre orderId), transaction_reference, amount, currency } }
SUCCESS + RECEIVED = paiement accepté

### Vérification manuelle
GET /api/agent/verif-pay?orderId=<notre_ref>&payId=<ref_soleaspay>
Headers: x-api-key

### IDs opérateurs valides
1=MTN CM, 2=Orange CM, 5=Express Union CM
29=Orange CI, 30=MTN CI, 31=Moov CI, 32=Wave CI
33=Moov BF, 34=Orange BF
35=MTN BJ, 36=Moov BJ
37=T-Money TG
52=Vodacom COD, 53=Airtel COD, 54=Orange COD
55=Airtel COG, 56=MTN COG
57=Airtel GAB
58=Airtel UGA, 59=MTN UGA

---

## Format API staging backend

### POST /payment/pay
{ service, wallet, amount, payer, payerEmail, productName, productId (ou products:[{productId,quantity}]), type }
type = "product" | "cart" | "recharge"
Réponse: { success: true, data: { orderId: "SI-..." } }

### GET /payment/verify?orderId=X&payId=Y
Réponse: { success: true, data: { status: "SUCCESS"|"PENDING"|"FAILED" } }

### POST /wallet/pay
{ productId: X } ou { products: [{productId, quantity}] }
Wallet = wallet_balance sur la table users (PAS de table wallets séparée sur staging)

### GET /wallet
Réponse: { success: true, data: { balance: 5000 } }

---

## Frontend — client.js (format correct)

Payment.pay(data) → POST /payment/pay
Payment.verify(orderId, payId) → GET /payment/verify?orderId=X&payId=Y
Wallet.getBalance() → GET /wallet
Wallet.pay(data) → POST /wallet/pay
PAS de Wallet.recharge — la recharge passe par Payment.pay avec type:"recharge"

---

## Variables d'env backend Render staging

SOLEASPAY_API_KEY=_NV6T8M1LXYJVCL2oQ5NjRRiW-KR5mOEe3J21nus_Eg-AP
APP_URL=https://stream-it.shop
RESEND_API_KEY=re_DZKnAzgG_ANHCgC5bzuSsH9i7AcmAK5HQ
FROM_EMAIL=noreply@stream-it.shop

---

## Erreurs à ne pas répéter

1. Travailler sur master → n'est JAMAIS déployé sur staging Render
2. CinetPay n'a JAMAIS existé sur ce site (Soleas Pay depuis le début)
3. Champ Soleas Pay : orderId (camelCase) pas order_id
4. Status webhook : "SUCCESS"/"RECEIVED" pas "ACCEPTED"
5. Webhook payload : data.external_reference pas payload.order_id
6. Endpoint : /api/agent/bills/v3 pas /api/agent/bills?from=SELF
7. Pas de Wallet.recharge dans client.js
8. PaymentModal: NE PAS utiliser Orders.create() + order_id (c'est le format master jamais déployé)

---

## Google OAuth (prévu — clés Clerk requises)

Plan: .claude/plans/swirling-exploring-dragonfly.md
Backend: POST /auth/oauth/google (vérifie token Clerk → trouve/crée user → retourne JWT)
Frontend: @clerk/clerk-react + GoogleSignInButton sur Login + Register
Status: EN ATTENTE des clés CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY

---

## Liens

- Soleas Pay docs: https://doc.mysoleas.com/soleaspay-v3/
- Soleas Pay dashboard: https://app.soleaspay.com
- Render: https://dashboard.render.com
- Resend: https://resend.com
