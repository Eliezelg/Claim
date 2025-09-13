export interface TranslationKeys {
  // Header
  'header.logo': string;
  'header.nav.howItWorks': string;
  'header.nav.yourRights': string;
  'header.nav.faq': string;
  'header.nav.contact': string;
  'header.auth.signIn': string;
  'header.auth.getStarted': string;

  // Hero Section
  'hero.title': string;
  'hero.subtitle': string;
  'hero.trustIndicators.successfulClaims': string;
  'hero.trustIndicators.successRate': string;
  'hero.cta.checkFlight': string;

  // Flight Search Form
  'form.flightNumber.label': string;
  'form.flightNumber.placeholder': string;
  'form.flightDate.label': string;
  'form.departure.label': string;
  'form.departure.placeholder': string;
  'form.arrival.label': string;
  'form.arrival.placeholder': string;
  'form.submit.checkFlight': string;

  // Compensation Calculator
  'calculator.title': string;
  'calculator.subtitle': string;
  'calculator.euRegulation': string;
  'calculator.israelLaw': string;
  'calculator.eligible': string;
  'calculator.notEligible': string;
  'calculator.startClaim': string;

  // Claim Form
  'claim.personalInfo.title': string;
  'claim.personalInfo.subtitle': string;
  'claim.firstName.label': string;
  'claim.lastName.label': string;
  'claim.email.label': string;
  'claim.phone.label': string;
  'claim.country.label': string;
  'claim.address.label': string;
  'claim.iban.label': string;
  'claim.continue': string;
  'claim.back': string;

  // Document Upload
  'documents.title': string;
  'documents.subtitle': string;
  'documents.boardingPass.title': string;
  'documents.boardingPass.description': string;
  'documents.receipts.title': string;
  'documents.receipts.description': string;
  'documents.dragDrop': string;
  'documents.chooseFile': string;
  'documents.supportedFormats': string;
  'documents.submit': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.subtitle': string;
  'dashboard.newClaim': string;
  'dashboard.stats.totalClaims': string;
  'dashboard.stats.successful': string;
  'dashboard.stats.inProgress': string;
  'dashboard.stats.totalReceived': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.cancel': string;
  'common.save': string;
  'common.edit': string;
  'common.delete': string;
  'common.view': string;
  'common.download': string;

  // Languages
  'languages.en': string;
  'languages.he': string;
  'languages.fr': string;
  'languages.es': string;
}

export const translations: Record<string, TranslationKeys> = {
  en: {
    // Header
    'header.logo': 'FlightClaim',
    'header.nav.howItWorks': 'How it works',
    'header.nav.yourRights': 'Your rights',
    'header.nav.faq': 'FAQ',
    'header.nav.contact': 'Contact',
    'header.auth.signIn': 'Sign In',
    'header.auth.getStarted': 'Get Started',

    // Hero Section
    'hero.title': 'Get up to €600 for your delayed or cancelled flight',
    'hero.subtitle': 'We help passengers claim compensation under EU 261/2004 and Israeli Aviation Services Law. Free to check, no win no fee.',
    'hero.trustIndicators.successfulClaims': '45,000+ successful claims',
    'hero.trustIndicators.successRate': '98% success rate',
    'hero.cta.checkFlight': 'Check Your Flight',

    // Flight Search Form
    'form.flightNumber.label': 'Flight Number',
    'form.flightNumber.placeholder': 'e.g. LH123',
    'form.flightDate.label': 'Flight Date',
    'form.departure.label': 'From',
    'form.departure.placeholder': 'Departure airport',
    'form.arrival.label': 'To',
    'form.arrival.placeholder': 'Arrival airport',
    'form.submit.checkFlight': 'Check My Flight',

    // Compensation Calculator
    'calculator.title': 'Your Compensation Estimate',
    'calculator.subtitle': 'Based on your flight details and applicable regulations',
    'calculator.euRegulation': 'EU Regulation 261/2004',
    'calculator.israelLaw': 'Israeli Aviation Services Law',
    'calculator.eligible': 'Eligible',
    'calculator.notEligible': 'Not Eligible',
    'calculator.startClaim': 'Start My Claim',

    // Claim Form
    'claim.personalInfo.title': 'Personal Information',
    'claim.personalInfo.subtitle': 'Please provide your contact details for the claim',
    'claim.firstName.label': 'First Name',
    'claim.lastName.label': 'Last Name',
    'claim.email.label': 'Email Address',
    'claim.phone.label': 'Phone Number',
    'claim.country.label': 'Country of Residence',
    'claim.address.label': 'Full Address',
    'claim.iban.label': 'IBAN / Account Number',
    'claim.continue': 'Continue',
    'claim.back': 'Back',

    // Document Upload
    'documents.title': 'Upload Your Documents',
    'documents.subtitle': 'Please provide your boarding pass and any relevant receipts',
    'documents.boardingPass.title': 'Boarding Pass',
    'documents.boardingPass.description': 'Upload your boarding pass to verify your flight booking and seat assignment',
    'documents.receipts.title': 'Additional Receipts',
    'documents.receipts.description': 'Upload receipts for meals, accommodation, or transport expenses caused by the delay',
    'documents.dragDrop': 'Drag & drop your files here',
    'documents.chooseFile': 'Choose File',
    'documents.supportedFormats': 'Supports: PDF, JPG, PNG (max 10MB)',
    'documents.submit': 'Submit Claim',

    // Dashboard
    'dashboard.title': 'My Claims',
    'dashboard.subtitle': 'Track and manage your compensation claims',
    'dashboard.newClaim': 'New Claim',
    'dashboard.stats.totalClaims': 'Total Claims',
    'dashboard.stats.successful': 'Successful',
    'dashboard.stats.inProgress': 'In Progress',
    'dashboard.stats.totalReceived': 'Total Received',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.download': 'Download',

    // Languages
    'languages.en': 'English',
    'languages.he': 'עברית',
    'languages.fr': 'Français',
    'languages.es': 'Español',
  },
  he: {
    // Header
    'header.logo': 'FlightClaim',
    'header.nav.howItWorks': 'איך זה עובד',
    'header.nav.yourRights': 'הזכויות שלכם',
    'header.nav.faq': 'שאלות נפוצות',
    'header.nav.contact': 'צור קשר',
    'header.auth.signIn': 'כניסה',
    'header.auth.getStarted': 'התחל כאן',

    // Hero Section
    'hero.title': 'קבלו עד €600 עבור הטיסה המתעכבת או המבוטלת שלכם',
    'hero.subtitle': 'אנחנו עוזרים לנוסעים לתבוע פיצויים לפי תקנה אירופית CE 261/2004 וחוק השירותים האווירים הישראלי. בדיקה חינם, ללא זכייה ללא תשלום.',
    'hero.trustIndicators.successfulClaims': '+45,000 תביעות מוצלחות',
    'hero.trustIndicators.successRate': '98% שיעור הצלחה',
    'hero.cta.checkFlight': 'בדקו את הטיסה שלכם',

    // Flight Search Form
    'form.flightNumber.label': 'מספר טיסה',
    'form.flightNumber.placeholder': 'למשל LH123',
    'form.flightDate.label': 'תאריך טיסה',
    'form.departure.label': 'מאיפה',
    'form.departure.placeholder': 'שדה תעופה יציאה',
    'form.arrival.label': 'לאן',
    'form.arrival.placeholder': 'שדה תעופה הגעה',
    'form.submit.checkFlight': 'בדוק את הטיסה שלי',

    // Compensation Calculator
    'calculator.title': 'הערכת הפיצוי שלכם',
    'calculator.subtitle': 'מבוסס על פרטי הטיסה והתקנות החלות',
    'calculator.euRegulation': 'תקנה אירופית 261/2004',
    'calculator.israelLaw': 'חוק שירותי התעופה הישראלי',
    'calculator.eligible': 'זכאי',
    'calculator.notEligible': 'לא זכאי',
    'calculator.startClaim': 'התחל את התביעה שלי',

    // Claim Form
    'claim.personalInfo.title': 'מידע אישי',
    'claim.personalInfo.subtitle': 'אנא ספקו את פרטי הקשר שלכם עבור התביעה',
    'claim.firstName.label': 'שם פרטי',
    'claim.lastName.label': 'שם משפחה',
    'claim.email.label': 'כתובת אימייל',
    'claim.phone.label': 'מספר טלפון',
    'claim.country.label': 'מדינת מגורים',
    'claim.address.label': 'כתובת מלאה',
    'claim.iban.label': 'IBAN / מספר חשבון',
    'claim.continue': 'המשך',
    'claim.back': 'חזור',

    // Document Upload
    'documents.title': 'העלו את המסמכים שלכם',
    'documents.subtitle': 'אנא ספקו את כרטיס העלייה וכל קבלות רלוונטיות',
    'documents.boardingPass.title': 'כרטיס עלייה',
    'documents.boardingPass.description': 'העלו את כרטיס העלייה כדי לאמת את הזמנת הטיסה והמושב שלכם',
    'documents.receipts.title': 'קבלות נוספות',
    'documents.receipts.description': 'העלו קבלות עבור ארוחות, לינה או הוצאות תחבורה שנגרמו בגלל העיכוב',
    'documents.dragDrop': 'גררו ושחררו את הקבצים כאן',
    'documents.chooseFile': 'בחרו קובץ',
    'documents.supportedFormats': 'תומך ב: PDF, JPG, PNG (מקסימום 10MB)',
    'documents.submit': 'שלח תביעה',

    // Dashboard
    'dashboard.title': 'התביעות שלי',
    'dashboard.subtitle': 'עקבו ונהלו את תביעות הפיצוי שלכם',
    'dashboard.newClaim': 'תביעה חדשה',
    'dashboard.stats.totalClaims': 'סך התביעות',
    'dashboard.stats.successful': 'מוצלחות',
    'dashboard.stats.inProgress': 'בתהליך',
    'dashboard.stats.totalReceived': 'סך שהתקבל',

    // Common
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.cancel': 'ביטול',
    'common.save': 'שמור',
    'common.edit': 'עריכה',
    'common.delete': 'מחק',
    'common.view': 'צפה',
    'common.download': 'הורד',

    // Languages
    'languages.en': 'English',
    'languages.he': 'עברית',
    'languages.fr': 'Français',
    'languages.es': 'Español',
  },
  fr: {
    // Header
    'header.logo': 'FlightClaim',
    'header.nav.howItWorks': 'Comment ça marche',
    'header.nav.yourRights': 'Vos droits',
    'header.nav.faq': 'FAQ',
    'header.nav.contact': 'Contact',
    'header.auth.signIn': 'Se connecter',
    'header.auth.getStarted': 'Commencer',

    // Hero Section
    'hero.title': 'Obtenez jusqu\'à 600€ pour votre vol retardé ou annulé',
    'hero.subtitle': 'Nous aidons les passagers à réclamer des indemnisations selon le règlement CE 261/2004 et la loi israélienne sur les services aériens. Vérification gratuite, pas de gain pas de frais.',
    'hero.trustIndicators.successfulClaims': '+45 000 réclamations réussies',
    'hero.trustIndicators.successRate': '98% de taux de réussite',
    'hero.cta.checkFlight': 'Vérifiez votre vol',

    // Flight Search Form
    'form.flightNumber.label': 'Numéro de vol',
    'form.flightNumber.placeholder': 'ex. LH123',
    'form.flightDate.label': 'Date du vol',
    'form.departure.label': 'De',
    'form.departure.placeholder': 'Aéroport de départ',
    'form.arrival.label': 'Vers',
    'form.arrival.placeholder': 'Aéroport d\'arrivée',
    'form.submit.checkFlight': 'Vérifier mon vol',

    // Compensation Calculator
    'calculator.title': 'Votre estimation d\'indemnisation',
    'calculator.subtitle': 'Basée sur les détails de votre vol et les réglementations applicables',
    'calculator.euRegulation': 'Règlement UE 261/2004',
    'calculator.israelLaw': 'Loi israélienne sur les services aériens',
    'calculator.eligible': 'Éligible',
    'calculator.notEligible': 'Non éligible',
    'calculator.startClaim': 'Commencer ma réclamation',

    // Claim Form
    'claim.personalInfo.title': 'Informations personnelles',
    'claim.personalInfo.subtitle': 'Veuillez fournir vos coordonnées pour la réclamation',
    'claim.firstName.label': 'Prénom',
    'claim.lastName.label': 'Nom de famille',
    'claim.email.label': 'Adresse e-mail',
    'claim.phone.label': 'Numéro de téléphone',
    'claim.country.label': 'Pays de résidence',
    'claim.address.label': 'Adresse complète',
    'claim.iban.label': 'IBAN / Numéro de compte',
    'claim.continue': 'Continuer',
    'claim.back': 'Retour',

    // Document Upload
    'documents.title': 'Téléchargez vos documents',
    'documents.subtitle': 'Veuillez fournir votre carte d\'embarquement et tous reçus pertinents',
    'documents.boardingPass.title': 'Carte d\'embarquement',
    'documents.boardingPass.description': 'Téléchargez votre carte d\'embarquement pour vérifier votre réservation de vol et attribution de siège',
    'documents.receipts.title': 'Reçus supplémentaires',
    'documents.receipts.description': 'Téléchargez les reçus pour les repas, l\'hébergement ou les frais de transport causés par le retard',
    'documents.dragDrop': 'Glissez et déposez vos fichiers ici',
    'documents.chooseFile': 'Choisir un fichier',
    'documents.supportedFormats': 'Supporte : PDF, JPG, PNG (max 10MB)',
    'documents.submit': 'Soumettre la réclamation',

    // Dashboard
    'dashboard.title': 'Mes réclamations',
    'dashboard.subtitle': 'Suivez et gérez vos réclamations d\'indemnisation',
    'dashboard.newClaim': 'Nouvelle réclamation',
    'dashboard.stats.totalClaims': 'Total des réclamations',
    'dashboard.stats.successful': 'Réussies',
    'dashboard.stats.inProgress': 'En cours',
    'dashboard.stats.totalReceived': 'Total reçu',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.view': 'Voir',
    'common.download': 'Télécharger',

    // Languages
    'languages.en': 'English',
    'languages.he': 'עברית',
    'languages.fr': 'Français',
    'languages.es': 'Español',
  },
  es: {
    // Header
    'header.logo': 'FlightClaim',
    'header.nav.howItWorks': 'Cómo funciona',
    'header.nav.yourRights': 'Tus derechos',
    'header.nav.faq': 'FAQ',
    'header.nav.contact': 'Contacto',
    'header.auth.signIn': 'Iniciar sesión',
    'header.auth.getStarted': 'Empezar',

    // Hero Section
    'hero.title': 'Obtén hasta €600 por tu vuelo retrasado o cancelado',
    'hero.subtitle': 'Ayudamos a los pasajeros a reclamar compensaciones bajo el Reglamento CE 261/2004 y la Ley de Servicios Aéreos de Israel. Comprobación gratuita, sin ganancia sin tarifa.',
    'hero.trustIndicators.successfulClaims': '+45,000 reclamaciones exitosas',
    'hero.trustIndicators.successRate': '98% tasa de éxito',
    'hero.cta.checkFlight': 'Verifica tu vuelo',

    // Flight Search Form
    'form.flightNumber.label': 'Número de vuelo',
    'form.flightNumber.placeholder': 'ej. LH123',
    'form.flightDate.label': 'Fecha del vuelo',
    'form.departure.label': 'Desde',
    'form.departure.placeholder': 'Aeropuerto de salida',
    'form.arrival.label': 'Hacia',
    'form.arrival.placeholder': 'Aeropuerto de llegada',
    'form.submit.checkFlight': 'Verificar mi vuelo',

    // Compensation Calculator
    'calculator.title': 'Tu estimación de compensación',
    'calculator.subtitle': 'Basada en los detalles de tu vuelo y regulaciones aplicables',
    'calculator.euRegulation': 'Reglamento UE 261/2004',
    'calculator.israelLaw': 'Ley de Servicios Aéreos de Israel',
    'calculator.eligible': 'Elegible',
    'calculator.notEligible': 'No elegible',
    'calculator.startClaim': 'Iniciar mi reclamación',

    // Claim Form
    'claim.personalInfo.title': 'Información personal',
    'claim.personalInfo.subtitle': 'Por favor proporciona tus datos de contacto para la reclamación',
    'claim.firstName.label': 'Nombre',
    'claim.lastName.label': 'Apellido',
    'claim.email.label': 'Dirección de correo',
    'claim.phone.label': 'Número de teléfono',
    'claim.country.label': 'País de residencia',
    'claim.address.label': 'Dirección completa',
    'claim.iban.label': 'IBAN / Número de cuenta',
    'claim.continue': 'Continuar',
    'claim.back': 'Atrás',

    // Document Upload
    'documents.title': 'Sube tus documentos',
    'documents.subtitle': 'Por favor proporciona tu tarjeta de embarque y cualquier recibo relevante',
    'documents.boardingPass.title': 'Tarjeta de embarque',
    'documents.boardingPass.description': 'Sube tu tarjeta de embarque para verificar tu reserva de vuelo y asignación de asiento',
    'documents.receipts.title': 'Recibos adicionales',
    'documents.receipts.description': 'Sube recibos de comidas, alojamiento o gastos de transporte causados por el retraso',
    'documents.dragDrop': 'Arrastra y suelta tus archivos aquí',
    'documents.chooseFile': 'Elegir archivo',
    'documents.supportedFormats': 'Soporta: PDF, JPG, PNG (máx 10MB)',
    'documents.submit': 'Enviar reclamación',

    // Dashboard
    'dashboard.title': 'Mis reclamaciones',
    'dashboard.subtitle': 'Rastrea y gestiona tus reclamaciones de compensación',
    'dashboard.newClaim': 'Nueva reclamación',
    'dashboard.stats.totalClaims': 'Total de reclamaciones',
    'dashboard.stats.successful': 'Exitosas',
    'dashboard.stats.inProgress': 'En progreso',
    'dashboard.stats.totalReceived': 'Total recibido',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.view': 'Ver',
    'common.download': 'Descargar',

    // Languages
    'languages.en': 'English',
    'languages.he': 'עברית',
    'languages.fr': 'Français',
    'languages.es': 'Español',
  },
};

export function t(key: keyof TranslationKeys, language: string = 'en'): string {
  return translations[language]?.[key] || translations['en'][key] || key;
}
