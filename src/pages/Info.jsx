import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'

const sections = {
  about: {
    title: 'Qui sommes-nous',
    content: (
      <>
        <p>
          <b>Stream-It</b> est une plateforme camerounaise specialisee dans la vente d'abonnements digitaux premium.
          Nous rendons accessibles les meilleurs services de streaming et de divertissement a des prix imbattables,
          avec un paiement simple via Mobile Money.
        </p>
        <p>
          Notre mission : permettre a chacun de profiter de Netflix, Spotify, Disney+, Amazon Prime et bien
          d'autres services sans les contraintes des cartes bancaires internationales.
        </p>
        <h3>Pourquoi nous choisir ?</h3>
        <ul>
          <li><b>Prix competitifs</b> — Jusqu'a 80% d'economies par rapport aux tarifs standards</li>
          <li><b>Paiement local</b> — MTN MoMo et Orange Money acceptes</li>
          <li><b>Livraison instantanee</b> — Recevez vos acces par email en quelques minutes</li>
          <li><b>Support reactif</b> — Equipe disponible du lundi au samedi, 8h-22h</li>
        </ul>
      </>
    ),
  },
  'how-it-works': {
    title: 'Comment ca marche',
    content: (
      <>
        <p>Obtenir votre abonnement premium en 4 etapes simples :</p>
        <div className="grid gap-4 my-6">
          {[
            { step: '1', title: 'Creez votre compte', desc: 'Inscrivez-vous gratuitement en quelques secondes avec votre email.' },
            { step: '2', title: 'Rechargez votre portefeuille', desc: 'Ajoutez du solde via MTN MoMo ou Orange Money. Rapide et securise.' },
            { step: '3', title: 'Choisissez votre abonnement', desc: 'Parcourez notre catalogue : Netflix, Spotify, Disney+, gaming et plus.' },
            { step: '4', title: 'Recevez vos acces', desc: 'Vos identifiants sont envoyes par email instantanement apres l\'achat.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">{s.step}</div>
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-slate-400 text-sm mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p>C'est aussi simple que ca. Pas de carte bancaire, pas de verification complexe.</p>
      </>
    ),
  },
  payments: {
    title: 'Paiements acceptes',
    content: (
      <>
        <p>Nous acceptons les paiements <b>Mobile Money</b> dans <b>9 pays africains</b> via notre partenaire SoleasPay :</p>

        <div className="grid sm:grid-cols-2 gap-3 my-6">
          {[
            { flag: '\ud83c\udde8\ud83c\uddf2', country: 'Cameroun', ops: 'MTN MoMo, Orange Money' },
            { flag: '\ud83c\udde8\ud83c\uddee', country: "Cote d'Ivoire", ops: 'MTN MoMo, Orange Money, Moov Money, Wave' },
            { flag: '\ud83c\udde7\ud83c\uddeb', country: 'Burkina Faso', ops: 'Orange Money, Moov Money' },
            { flag: '\ud83c\udde7\ud83c\uddef', country: 'Benin', ops: 'MTN MoMo, Moov Money' },
            { flag: '\ud83c\uddf9\ud83c\uddec', country: 'Togo', ops: 'Flooz (Moov), T-Money' },
            { flag: '\ud83c\udde8\ud83c\udde9', country: 'RD Congo', ops: 'Vodacom M-Pesa, Airtel Money, Orange Money' },
            { flag: '\ud83c\udde8\ud83c\uddec', country: 'Congo', ops: 'MTN MoMo, Airtel Money' },
            { flag: '\ud83c\uddec\ud83c\udde6', country: 'Gabon', ops: 'Airtel Money, Moov Money' },
            { flag: '\ud83c\uddfa\ud83c\uddec', country: 'Ouganda', ops: 'MTN MoMo, Airtel Money' },
          ].map(c => (
            <div key={c.country} className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <p className="font-bold text-white text-sm">{c.flag} {c.country}</p>
              <p className="text-slate-400 text-xs mt-1">{c.ops}</p>
            </div>
          ))}
        </div>

        <h3>Comment payer ?</h3>
        <ol>
          <li>Selectionnez votre produit et cliquez <b>Commander</b></li>
          <li>Choisissez votre <b>pays</b> et votre <b>operateur</b></li>
          <li>Entrez votre numero de telephone Mobile Money</li>
          <li>Validez le paiement sur votre telephone (notification USSD)</li>
          <li>Vos acces arrivent par <b>email</b> en quelques minutes</li>
        </ol>

        <h3>Portefeuille Stream-It</h3>
        <p>
          Vous pouvez aussi recharger votre <b>portefeuille Stream-It</b> en avance, puis payer vos abonnements
          en un clic sans repasser par Mobile Money a chaque fois. Ideal pour les achats frequents.
        </p>

        <p>Tous les paiements sont securises via <b>SoleasPay</b> et traites en temps reel. Devise : <b>XAF (Franc CFA)</b>.</p>
      </>
    ),
  },
  refunds: {
    title: 'Politique de remboursement',
    content: (
      <>
        <p>
          Chez Stream-It, votre satisfaction est notre priorite. Voici notre politique de remboursement :
        </p>
        <h3>Remboursement possible</h3>
        <ul>
          <li>Si les identifiants fournis ne fonctionnent pas et que nous ne pouvons pas les remplacer</li>
          <li>Si le service n'a pas ete livre dans les 24 heures suivant l'achat</li>
          <li>En cas d'erreur de notre part (double facturation, mauvais produit)</li>
        </ul>
        <h3>Remboursement non applicable</h3>
        <ul>
          <li>Si vous avez deja utilise les identifiants fournis</li>
          <li>Si le probleme vient d'une mauvaise utilisation de votre part</li>
          <li>Au-dela de 48 heures apres l'achat sans signalement prealable</li>
        </ul>
        <h3>Comment demander un remboursement ?</h3>
        <p>
          Contactez notre support via WhatsApp ou email avec votre numero de commande.
          Les remboursements sont credites sur votre portefeuille Stream-It sous 24h.
        </p>
      </>
    ),
  },
  terms: {
    title: "Conditions d'utilisation",
    content: (
      <>
        <p>En utilisant Stream-It, vous acceptez les conditions suivantes :</p>
        <h3>1. Utilisation du service</h3>
        <p>
          Stream-It est une plateforme de revente d'abonnements digitaux. Les comptes fournis sont
          destines a un usage personnel et ne doivent pas etre revendus ou partages au-dela de ce qui
          est prevu par l'offre souscrite.
        </p>
        <h3>2. Compte utilisateur</h3>
        <p>
          Vous etes responsable de la confidentialite de vos identifiants de connexion. Toute activite
          realisee depuis votre compte est sous votre responsabilite.
        </p>
        <h3>3. Paiements</h3>
        <p>
          Les prix sont affiches en Francs CFA (XAF). Le paiement est requis avant la livraison
          du service. Les transactions sont finales une fois le service livre.
        </p>
        <h3>4. Limitation de responsabilite</h3>
        <p>
          Stream-It ne peut etre tenu responsable des interruptions de service des fournisseurs tiers
          (Netflix, Spotify, etc.) ni des modifications de leurs conditions d'utilisation.
        </p>
      </>
    ),
  },
  privacy: {
    title: 'Confidentialite',
    content: (
      <>
        <p>La protection de vos donnees personnelles est essentielle pour nous.</p>
        <h3>Donnees collectees</h3>
        <ul>
          <li><b>Identite</b> — Nom, prenom, adresse email</li>
          <li><b>Transactions</b> — Historique d'achats et de paiements</li>
          <li><b>Connexion</b> — Adresse IP, type de navigateur (a des fins de securite)</li>
        </ul>
        <h3>Utilisation des donnees</h3>
        <ul>
          <li>Fournir et ameliorer nos services</li>
          <li>Envoyer des emails transactionnels (confirmations, identifiants, securite)</li>
          <li>Prevenir la fraude et assurer la securite des comptes</li>
        </ul>
        <h3>Partage des donnees</h3>
        <p>
          Vos donnees ne sont jamais vendues a des tiers. Elles sont partagees uniquement avec nos
          prestataires de paiement (SoleasPay) pour traiter vos transactions.
        </p>
        <h3>Vos droits</h3>
        <p>
          Vous pouvez demander la suppression de votre compte et de vos donnees a tout moment en
          contactant notre support.
        </p>
      </>
    ),
  },
  legal: {
    title: 'Mentions legales',
    content: (
      <>
        <h3>Editeur du site</h3>
        <p>
          Stream-It<br />
          Douala, Cameroun<br />
          Email : support@stream-it.shop
        </p>
        <h3>Hebergement</h3>
        <p>
          Le site est heberge par Render Inc. et Vercel Inc.<br />
          Les donnees sont stockees sur des serveurs securises.
        </p>
        <h3>Propriete intellectuelle</h3>
        <p>
          L'ensemble du contenu du site (textes, logos, design) est la propriete de Stream-It.
          Toute reproduction est interdite sans autorisation prealable.
        </p>
        <p>
          Les marques Netflix, Spotify, Disney+, Amazon Prime et autres sont la propriete de leurs
          detenteurs respectifs. Stream-It n'est affilie a aucun de ces services.
        </p>
      </>
    ),
  },
}

export default function Info() {
  const { section } = useParams()
  const data = sections[section]

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <SEO title="Page introuvable" />
        <p className="text-4xl mb-4">404</p>
        <p className="text-slate-400 mb-6">Page introuvable</p>
        <Link to="/" className="btn-primary py-2.5 px-6">Retour a l'accueil</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title={data.title} />
      <Link to="/" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-6 inline-block">
        &larr; Retour a l'accueil
      </Link>
      <h1 className="text-3xl font-black mb-8">{data.title}</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300 leading-relaxed
        [&_h3]:text-white [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-8 [&_h3]:mb-3
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
        [&_li]:text-slate-400
        [&_b]:text-white [&_b]:font-semibold
        [&_a]:text-indigo-400 [&_a]:underline">
        {data.content}
      </div>
    </div>
  )
}
