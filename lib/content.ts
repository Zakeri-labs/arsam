export type Language = 'en' | 'fa' | 'ar';
export type Country = 'uae' | 'oman';

export interface Service {
  id: string;
  title: string;
  description: string;
  serviceFee?: string;
  governmentFees?: string;
  workingDays?: string;
  requirements?: string[];
  category?: string;
  imageUrl?: string;
}

export interface Content {
  header: {
    title: string;
    subtitle: string;
    tagline: string;
  };
  services: {
    title: string;
    items: Service[];
  };
  cta: {
    title: string;
    button: string;
  };
  footer: {
    copyright: string;
  };
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  fa: 'فارسی',
  ar: 'العربية',
};

export const countryNames: Record<Language, Record<Country, string>> = {
  en: { uae: 'United Arab Emirates', oman: 'Sultanate of Oman' },
  fa: { uae: 'امارات متحده عربی', oman: 'سلطان‌نشین عمان' },
  ar: { uae: 'الإمارات العربية المتحدة', oman: 'سلطنة عُمان' },
};

export const modalContent: Record<Language, { selectLanguage: string; selectCountry: string; continue: string }> = {
  en: { selectLanguage: 'Select Your Language', selectCountry: 'Select Your Destination', continue: 'Continue' },
  fa: { selectLanguage: 'زبان خود را انتخاب کنید', selectCountry: 'مقصد خود را انتخاب کنید', continue: 'ادامه' },
  ar: { selectLanguage: 'اختر لغتك', selectCountry: 'اختر وجهتك', continue: 'متابعة' },
};

// ─── ENGLISH SERVICES LIST ───────────────────────────────────────────────────
export const servicesListEN: Service[] = [
  // 1. Company Setup Services
  {
    id: 'company-mainland',
    title: 'Company Registration (Mainland)',
    description: 'Establish a company in mainland UAE or Oman with 100% foreign ownership. We process trade name reservation, initial approvals, DED/MOCI registrations, and MOA signing.',
    serviceFee: 'AED 3,000',
    governmentFees: 'From AED 12,000',
    workingDays: '5 Working Days',
    requirements: ['Copy of Passport', 'Copy of Tourist Visa / Entry Stamp', 'Three Proposed Trade Names'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'Company Registration (Freezone)',
    description: 'Set up your business in premium Free Zones with 100% tax exemption, full import/export exemption, and no corporate tax. Includes business license and lease agreement.',
    serviceFee: 'AED 2,500',
    governmentFees: 'From AED 9,500',
    workingDays: '4 Working Days',
    requirements: ['Copy of Passport', 'Passport-size Photo with White Background', 'Proposed Business Activities'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'Trademark Registration',
    description: 'Protect your brand identity legally. We handle trademark search, application filing, ministry publications, and final registration certificate issuance.',
    serviceFee: 'AED 1,500',
    governmentFees: 'AED 7,500',
    workingDays: '15 Working Days',
    requirements: ['Trademark Logo / Design', 'Trade License Copy', 'Power of Attorney'],
    category: 'Company Setup Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'Business Setup Consulting',
    description: 'Expert advisory on structural setup, partner distributions, commercial unit selections, and legal setup options for commercial entities.',
    serviceFee: 'AED 500',
    workingDays: '3 Working Days',
    requirements: ['Concept Description', 'Initial Capital Planning', 'Proposed Location Ideas'],
    category: 'Company Setup Services'
  },
  {
    id: 'feasibility-study',
    title: 'Feasibility Study & Business Plan',
    description: 'Professional feasibility studies and business plans, structured specifically for bank loan applications, ministry approvals, and investor presentations.',
    serviceFee: 'AED 1,500',
    workingDays: '8 Working Days',
    requirements: ['Market Concept Description', 'Project Financial Estimates', 'Competitors Information'],
    category: 'Company Setup Services'
  },

  // 2. Family & Business Visas
  {
    id: 'family-residency-visa',
    title: 'Family Residency Visa',
    description: 'Process and issue residency visas for spouse, children, and parents. Includes document attestation, medical screening, Emirates ID processing, and visa stamping.',
    serviceFee: 'AED 450',
    governmentFees: 'AED 1,340',
    workingDays: '5 Working Days',
    requirements: ['Sponsor Passport & Visa Copy', 'Attestation of Marriage/Birth Certificates', 'Salary Certificate / Ejari'],
    category: 'Family & Business Visas'
  },
  {
    id: 'partner-investor-visa',
    title: 'Partner & Investor Visa',
    description: 'Secure long-term investor/partner residency visas for business owners and company shareholders with full local residency rights.',
    serviceFee: 'AED 650',
    governmentFees: 'AED 3,200',
    workingDays: '4 Working Days',
    requirements: ['Trade License Copy', 'Memorandum of Association (MOA)', 'Partner Passport Copy'],
    category: 'Family & Business Visas'
  },
  {
    id: 'business-employment-visa',
    title: 'Business & Employment Visa',
    description: 'Complete quota processing, work permits, and employment visa issuance for corporate employees under mainland or freezone entities.',
    serviceFee: 'AED 350',
    governmentFees: 'AED 1,850',
    workingDays: '5 Working Days',
    requirements: ['Trade License Copy', 'Establishment Card', 'Employee Passport & Photo'],
    category: 'Family & Business Visas'
  },
  {
    id: 'golden-visa-services',
    title: 'Golden Visa Processing (10 Years)',
    description: 'Direct nomination and processing for 10-Year Golden Residency Visas for investors, entrepreneurs, executives, and specialized talents.',
    serviceFee: 'AED 1,500',
    governmentFees: 'AED 4,800',
    workingDays: '7 Working Days',
    requirements: ['Bank Statement / Property Deed / License', 'Passport Copy', 'EID / Entry Permit'],
    category: 'Family & Business Visas'
  },

  // 3. Tourist Visa Extension Services
  {
    id: 'tourist-visa-30-days',
    title: '30 Days Tourist Visa Extension',
    description: 'Extend your 30-day tourist visa swiftly without hassle. Direct application processing with immigration portals.',
    serviceFee: 'AED 290',
    workingDays: '2 Working Days',
    requirements: ['Passport Copy', 'Current Tourist Visa Copy', 'Passport Photo'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: '60 Days Tourist Visa Extension',
    description: 'Secure an extended 60-day tourist visa renewal for family holidays, business exploration, or extended stays.',
    serviceFee: 'AED 490',
    workingDays: '2 Working Days',
    requirements: ['Passport Copy', 'Current Tourist Visa Copy', 'Passport Photo'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'Multi-Entry 60 Days Visa Extension',
    description: 'Multi-entry 60-day visa extension processed rapidly for frequent business travelers entering and leaving the country.',
    serviceFee: 'AED 790',
    workingDays: '1 Working Day',
    requirements: ['Passport Copy', 'Current Tourist Visa Copy', 'Passport Photo'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'In-Country Visa Extension (No Exit)',
    description: 'Extend your tourist visa without exiting the country. Complete in-country status change and extension up to 4 months total stay.',
    serviceFee: 'AED 1,090',
    workingDays: '1 Working Day',
    requirements: ['Passport Copy', 'Current Tourist Visa Copy', 'Passport Photo'],
    category: 'Tourist Visa Extension Services'
  },

  // 4. License Renewal Services
  {
    id: 'trade-license-renewal',
    title: 'Mainland Trade License Renewal',
    description: 'Maintain your commercial operations without fines. We process trade license renewal, register Ejari contracts, and secure department approvals.',
    serviceFee: 'AED 300',
    governmentFees: 'From AED 4,270',
    workingDays: '3 Working Days',
    requirements: ['Ejari Must be Valid', 'Valid Establishment Card', 'Pay Voucher Approval'],
    category: 'License Renewal Services'
  },
  {
    id: 'establishment-card-renewal',
    title: 'Establishment Card & Chamber Renewal',
    description: 'Ensure active corporate status by timely renewing your Establishment Card and Chamber of Commerce registration for smooth visa processing.',
    serviceFee: 'AED 150',
    governmentFees: 'AED 581',
    workingDays: '2 Working Days',
    requirements: ['Trade License Copy', 'Physical EID / Civil ID Required', 'Company Registration'],
    category: 'License Renewal Services'
  },
  {
    id: 'ejari-1-year',
    title: 'Ejari & Tenancy Contract Renewal',
    description: 'Official annual Ejari registration and commercial tenancy contract renewal for office, retail shop, and warehouse spaces.',
    serviceFee: 'AED 1,950',
    workingDays: '1 Working Day',
    requirements: ['Title Deed Copy', 'Landlord ID Copy', 'Trade License Copy'],
    category: 'License Renewal Services'
  },
  {
    id: 'baladiya-tenancy',
    title: 'Municipal (Baladiya) Contract Renewal',
    description: 'Renew your commercial tenancy contract with the Oman Municipality (Baladiya) for company registration and CR compliance.',
    serviceFee: 'AED 1,500',
    workingDays: '2 Working Days',
    requirements: ['Copy of Krooki', 'Landlord Civil ID', 'Company Commercial Registration (CR)'],
    category: 'License Renewal Services'
  },

  // 5. Car Rental Services
  {
    id: 'car-rental-daily-monthly',
    title: 'Daily & Monthly Car Rental',
    description: 'Rent economy, sedan, and executive cars on daily, weekly, or monthly basis. Comprehensive insurance and fast delivery.',
    serviceFee: 'AED 120 / Day',
    workingDays: 'Instant Delivery',
    requirements: ['Passport & Tourist Visa Copy', 'Home Driving License / IDP', 'Credit Card / Cash Deposit'],
    category: 'Car Rental Services'
  },
  {
    id: 'luxury-car-rental',
    title: 'Luxury & Sport Car Rental',
    description: 'Experience premium luxury and sports vehicles (Lamborghini, Ferrari, Rolls Royce, Porsche, Mercedes) for VIP travel and corporate events.',
    serviceFee: 'AED 800 / Day',
    workingDays: 'Instant Delivery',
    requirements: ['Valid Passport & Visa', 'International Driving Permit (IDP)', 'Security Deposit'],
    category: 'Car Rental Services'
  },
  {
    id: 'chauffeur-car-rental',
    title: 'Chauffeur Driven Car Rental',
    description: 'Luxury transportation with private multi-lingual drivers for airport transfers, corporate delegations, and city business tours.',
    serviceFee: 'AED 350 / 5 Hours',
    workingDays: 'Instant Booking',
    requirements: ['Flight Details / Pickup Address', 'Passenger Count', 'Booking Confirmation'],
    category: 'Car Rental Services'
  },
  {
    id: 'suv-family-car-rental',
    title: 'SUV & Family Car Rental',
    description: 'Spacious 7-seater SUVs and family vehicles for group travel and long-distance city transfers with full insurance coverage.',
    serviceFee: 'AED 250 / Day',
    workingDays: 'Instant Delivery',
    requirements: ['Passport Copy', 'Valid Driving License', 'Security Deposit'],
    category: 'Car Rental Services'
  },

  // 6. Banking Services
  {
    id: 'business-account-high-risk',
    title: 'Business Account Opening - High Risk Activities',
    description: 'Professional corporate bank account opening for high-risk business sectors. We manage compliance, background checks, and bank coordination.',
    serviceFee: 'AED 3,950',
    workingDays: '20 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'Business Account Opening - Low Risk Activities',
    description: 'Fast track corporate banking setup for low-risk business sectors. Swift approvals from top-tier local and international banks.',
    serviceFee: 'AED 2,950',
    workingDays: '5 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'Personal Bank Account Guidance',
    description: 'Open personal checking or savings accounts with top local banks. We review your profile, compile documents, and secure fast approvals.',
    serviceFee: 'AED 950',
    workingDays: '5 Working Days',
    requirements: ['Valid Residency Visa & EID', 'Passport with Entry Stamp', 'Salary Certificate or Proof of Funds'],
    category: 'Banking Services'
  },

  // 7. Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'Corporate Tax Registration',
    description: 'Official corporate tax registration with the Federal Tax Authority (FTA). Avoid penalties by registering within legal timelines.',
    serviceFee: 'AED 180',
    workingDays: '3 Working Days',
    requirements: ['Within 87 Days', 'Mandatory For all Companies', 'Avoid Fine'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'Corporate Tax Return Filing',
    description: 'Accurate corporate tax return preparation and submission within the legal deadline to prevent monthly penalties.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Within 9 Months', 'Mandatory For all Companies', 'Monthly Penalty Avoidance'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'VAT Registration',
    description: 'Official Value Added Tax (VAT) registration with tax authority. Mandatory for businesses exceeding legal revenue threshold.',
    serviceFee: 'AED 350',
    workingDays: '3 Working Days',
    requirements: ['Trade License Copy', 'Financial Statement', 'Passport & Visa of Manager'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'FTA Profile Update',
    description: 'Official update of Federal Tax Authority profile following updates in trade license, managing partners, or office location.',
    serviceFee: 'AED 280',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Updated', 'Manager Visa Must Be Updated', 'Company Location Must Be Updated'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'Request For Tax Reconsideration',
    description: 'Submit professional appeals and waiver requests for tax penalties under tax authority laws.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Penalty Reconsideration', 'According to Tax Laws', 'Legal Review'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'Industrial Tax Exemptions',
    description: 'Obtain official industrial tax exemption certificates for raw materials, machinery, or industrial operations.',
    serviceFee: 'AED 950',
    workingDays: '10 Working Days',
    requirements: ['Industrial License Copy', 'List of Raw Materials & Equipment', 'Environmental Approval'],
    category: 'Tax Services'
  },

  // 8. General Government Services
  {
    id: 'driving-license-guidance',
    title: 'Driving License Guidance',
    description: 'Step-by-step guidance for converting your home country driving license or starting a new file. We arrange eye tests and appointments.',
    serviceFee: 'AED 350',
    governmentFees: 'AED 850',
    workingDays: '5 Working Days',
    requirements: ['Valid ID Copy', 'Original Home Country Driving License', 'Eye Test Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'Dubai Municipality Permits',
    description: 'Secure commercial, advertising, or fit-out permits from Dubai Municipality. We handle technical plan approvals.',
    serviceFee: 'AED 650',
    governmentFees: 'From AED 1,500',
    workingDays: '5 Working Days',
    requirements: ['Trade License Copy', 'Tenancy Contract / Ejari', 'Layout Plan of Office/Shop'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'Dubai Sports Council Permits',
    description: 'Obtain official activity approvals and licenses for sports events, gyms, or academies from Dubai Sports Council.',
    serviceFee: 'AED 850',
    governmentFees: 'From AED 2,500',
    workingDays: '7 Working Days',
    requirements: ['Trade License Copy', 'Trainer Certificates / Qualifications', 'Premises Safety Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'RERA (Real Estate Permits)',
    description: 'Secure real estate commercial activity approvals, broker licenses, or property advertisement permits.',
    serviceFee: 'AED 950',
    governmentFees: 'From AED 3,500',
    workingDays: '5 Working Days',
    requirements: ['Trade License Copy', 'Manager Broker Card / Certificate', 'Ejari of Commercial Office'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'Customs Clearance (Bayan)',
    description: 'Fast and professional customs cargo clearance through official Bayan Customs System in Oman.',
    serviceFee: 'AED 450',
    workingDays: '2 Working Days',
    requirements: ['Import/Export License', 'Commercial Invoice & Packing List', 'Certificate of Origin'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'Made in Oman Certificate',
    description: 'Secure official "Made in Oman" quality certificate for locally manufactured products to qualify for procurement advantages.',
    serviceFee: 'AED 550',
    workingDays: '5 Working Days',
    requirements: ['Industrial/Trade License Copy', 'Proof of Local Value Addition', 'Product Test Report'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'Riyada Card Guidance',
    description: 'Comprehensive assistance for securing Omani Riyada Card for small and medium enterprises (SMEs).',
    serviceFee: 'AED 250',
    workingDays: '3 Working Days',
    requirements: ['Omani Ownership Proof', 'Valid Trade License', 'Active Social Insurance Registration'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'PACDA Safety Permits',
    description: 'Obtain official fire safety approvals and municipal safety permits from Civil Defense authority.',
    serviceFee: 'AED 450',
    governmentFees: 'From AED 1,000',
    workingDays: '4 Working Days',
    requirements: ['Trade License Copy', 'Tenancy Contract', 'Fire Fighting Equipment Certificate'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'Product Standards Certificate',
    description: 'Secure official product standards approvals and G-mark quality certifications from Directorate for Specifications.',
    serviceFee: 'AED 550',
    workingDays: '5 Working Days',
    requirements: ['Product Specifications Sheet', 'ISO / Quality Certificates Copy', 'Importer/Exporter License'],
    category: 'General Government Services'
  },
  {
    id: 'government-land-rental',
    title: 'Government Land Rental Guidance',
    description: 'Assistance in securing government-leased land for industrial, warehouse, or farming projects in industrial estates.',
    serviceFee: 'AED 950',
    workingDays: '10 Working Days',
    requirements: ['Valid Industrial/Commercial License', 'Project Feasibility Summary', 'Application Letter'],
    category: 'General Government Services'
  },
  {
    id: 'accounting-auditing',
    title: 'Accounting & Auditing Services',
    description: 'Professional bookkeeping, financial statements preparation, auditing, and accounting reviews to remain compliant.',
    serviceFee: 'AED 450',
    workingDays: '3 Working Days',
    requirements: ['Company Ledger / Bank Statements', 'Previous Tax Invoices List', 'Expenses Proof Documents'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'Omanisation Management',
    description: 'Ensure fully compliant recruitment in Oman. Align Omani and expat hiring distributions with ministry standards.',
    serviceFee: 'AED 650',
    workingDays: '4 Working Days',
    requirements: ['Trade License Copy', 'Active Employee Visa List', 'Desired Nationalization Target'],
    category: 'General Government Services'
  },
  {
    id: 'icv-certificate',
    title: 'In-Country Value (ICV) Certificate',
    description: 'Guidance and preparation for securing official In-Country Value (ICV) certificate for government tenders.',
    serviceFee: 'AED 1,500',
    workingDays: '7 Working Days',
    requirements: ['Audited Financial Statements', 'Omanisation Ratio Report', 'Local Purchase Invoices'],
    category: 'General Government Services'
  }
];

// ─── PERSIAN SERVICES LIST ───────────────────────────────────────────────────
export const servicesListFA: Service[] = [
  // 1. Company Setup Services
  {
    id: 'company-mainland',
    title: 'ثبت شرکت در سرزمین اصلی (Mainland)',
    description: 'ثبت شرکت در سرزمین اصلی امارات یا عمان با مالکیت ۱۰۰ درصد خارجی. انجام تمامی مراحل رزرواسیون نام تجاری، موافقت اولیه، ثبت در دپارتمان اقتصادی و امضای اساسنامه.',
    serviceFee: '۳,۰۰۰ درهم',
    governmentFees: 'از ۱۲,۰۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی پاسپورت سهام‌داران', 'کپی ویزای توریستی یا مهر ورود', 'سه نام پیشنهادی برای شرکت'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'ثبت شرکت در منطقه آزاد (Freezone)',
    description: 'راه‌اندازی کسب‌وکار در مناطق آزاد با معافیت ۱۰۰٪ مالیاتی و گمرکی و مالکیت کامل بدون نیاز به کفیل محلی. شامل صدور لایسنس، گواهی ثبت و اجاره‌نامه اداری.',
    serviceFee: '۲,۵۰۰ درهم',
    governmentFees: 'از ۹,۵۰۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی پاسپورت سهام‌داران', 'عکس پرسنلی با زمینه سفید', 'لیست فعالیت‌های تجاری مورد نظر'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'ثبت برند و علامت تجاری',
    description: 'حفاظت قانونی از هویت برند و لوگوی شما. انجام استعلام قبلی برند، ثبت پرونده در وزارت اقتصاد، انتشار در روزنامه رسمی و صدور سند ثبت نهایی.',
    serviceFee: '۱,۵۰۰ درهم',
    governmentFees: '۷,۵۰۰ درهم',
    workingDays: '۱۵ روز کاری',
    requirements: ['طرح یا لوگوی برند', 'کپی لایسنس تجاری شرکت', 'وکالت‌نامه رسمی'],
    category: 'Company Setup Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'مشاوره تخصصی راه‌اندازی کسب‌وکار',
    description: 'مشاوره تخصصی ساختار شرکت، سهم الشرکه شرکا، انتخاب نوع فعالیت تجاری و جانمایی ملکی شرکت‌های تجاری و صنعتی.',
    serviceFee: '۵۰۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['خلاصه ایده بیزینس', 'برنامه‌ریزی سرمایه اولیه', 'پیشنهاد مکان قرارگیری شرکت'],
    category: 'Company Setup Services'
  },
  {
    id: 'feasibility-study',
    title: 'طرح توجیهی و بیزینس پلن رسمی',
    description: 'تنظیم طرح‌های توجیهی فنی و اقتصادی و بیزینس پلن‌های حرفه‌ای ساختاریافته جهت ارائه به بانک‌ها، وزارتخانه‌ها و جذب سرمایه‌گذار.',
    serviceFee: '۱,۵۰۰ درهم',
    workingDays: '۸ روز کاری',
    requirements: ['توضیحات مدل کسب‌وکار', 'برآورد مالی و پیش‌بینی سودآوری', 'معرفی رقبا و بازار هدف'],
    category: 'Company Setup Services'
  },

  // 2. Family & Business Visas
  {
    id: 'family-residency-visa',
    title: 'ویزای اقامت خانوادگی',
    description: 'اخذ و تمدید ویزای اقامت رسمی همسر، فرزندان و والدین. انجام کلیه مراحل تایید مدارک، تست پزشکی، کارت ملی (EID/Civil ID) و ثبت ویزا.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: '۱,۳۴۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی پاسپورت و ویزای اسپانسر', 'تاییدیه سند ازدواج / شناسنامه فرزندان', 'گواهی حقوق یا عقد ایجاری'],
    category: 'Family & Business Visas'
  },
  {
    id: 'partner-investor-visa',
    title: 'ویزای اقامت شریک و سرمایه‌گذار',
    description: 'اخذ و تمدید ویزای اقامت رسمی سرمایه‌گذار و شریک تجاری برای صاحبان کسب‌وکار و سهام‌داران با برخوردی از کلیه مزایای شهروندی حقوقی.',
    serviceFee: '۶۵۰ درهم',
    governmentFees: '۳,۲۰۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'اساسنامه شرکت (MOA/CR)', 'کپی پاسپورت سهام‌دار'],
    category: 'Family & Business Visas'
  },
  {
    id: 'business-employment-visa',
    title: 'ویزای کار و تجاری کارمندان',
    description: 'مدیریت و صدور مجوزهای کار (Work Permit) و ویزای استخدامی پرسنل شرکت‌های فری‌زون و سرزمین اصلی.',
    serviceFee: '۳۵۰ درهم',
    governmentFees: '۱,۸۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'استبلیشمنت کارت شرکت', 'عکس و پاسپورت کارمند'],
    category: 'Family & Business Visas'
  },
  {
    id: 'golden-visa-services',
    title: 'خدمات اخذ ویزای ۱۰ ساله طلایی (Golden Visa)',
    description: 'فرآیند ثبت‌نام و اخذ ویزای طلایی ۱۰ ساله برای سرمایه‌گذاران، کارآفرینان، مدیران ارشد و متخصصان برجسته.',
    serviceFee: '۱,۵۰۰ درهم',
    governmentFees: '۴,۸۰۰ درهم',
    workingDays: '۷ روز کاری',
    requirements: ['تمکن مالی / سند ملک / لایسنس شرکت', 'کپی پاسپورت', 'کارت ملی / ویزای فعال'],
    category: 'Family & Business Visas'
  },

  // 3. Tourist Visa Extension Services
  {
    id: 'tourist-visa-30-days',
    title: 'تمدید ویزای توریستی ۳۰ روزه',
    description: 'تمدید فوری و بدون دغدغه ویزای گردشگری ۳۰ روزه از طریق پرتال‌های رسمی اداره مهاجرت جهت حفظ وضعیت قانونی.',
    serviceFee: '۲۹۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['کپی پاسپورت', 'کپی ویزای توریستی فعلی', 'عکس پرسنلی'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'تمدید ویزای توریستی ۶۰ روزه',
    description: 'تمدید ویزای توریستی ۶۰ روزه برای اقامت‌های طولانی‌تر خانوادگی یا پیگیری امور اداری و تجاری.',
    serviceFee: '۴۹۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['کپی پاسپورت', 'کپی ویزای توریستی فعلی', 'عکس پرسنلی'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'تمدید ویزای ۶۰ روزه چند بار ورود (مولتی)',
    description: 'تمدید سریع ویزای ۶۰ روزه مولتی با امکان چندین بار ورود و خروج برای بازرگانان و مسافران کثیرالسفر.',
    serviceFee: '۷۹۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['کپی پاسپورت', 'کپی ویزای توریستی فعلی', 'عکس پرسنلی'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تمدید ویزای توریستی در داخل کشور (بدون خروج)',
    description: 'تمدید ویزای توریستی و تغییر وضعیت اقامتی بدون نیاز به خروج از مرز تا سقف ۴ ماه اقامت کلی.',
    serviceFee: '۱,۰۹۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['کپی پاسپورت', 'کپی ویزای توریستی فعلی', 'عکس پرسنلی'],
    category: 'Tourist Visa Extension Services'
  },

  // 4. License Renewal Services
  {
    id: 'trade-license-renewal',
    title: 'تمدید لایسنس تجاری (Mainland & Freezone)',
    description: 'تمدید لایسنس تجاری شرکت‌های امارات و عمان، تمدید عقد ایجاری و صدور فیش‌های پرداختی دولتی بدون جریمه.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'از ۴,۲۷۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['عقد ایجاری / بلدیه معتبر', 'استبلیشمنت کارت معتبر شرکت', 'تاییدیه فیش‌های دولتی'],
    category: 'License Renewal Services'
  },
  {
    id: 'establishment-card-renewal',
    title: 'تمدید استبلیشمنت کارت و کارت بازرگانی',
    description: 'تمدید به موقع کارت تاسیس شرکت (Establishment Card) و عضویت اتاق بازرگانی جهت فعال ماندن پرتال‌های استخدامی.',
    serviceFee: '۱۵۰ درهم',
    governmentFees: '۵۸۱ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'کارت ملی امارات / عمان فیزیکی', 'ثبت قانونی شرکت'],
    category: 'License Renewal Services'
  },
  {
    id: 'ejari-1-year',
    title: 'تمدید قرارداد رسمی ایجاری سالانه',
    description: 'ثبت و تمدید قرارداد رسمی ایجاری سالانه واحدهای اداری، تجاری و انبارها به همراه پشتیبانی بازرسی.',
    serviceFee: '۱,۹۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['کپی سند ملک', 'کپی کارت ملی مالک', 'کپی لایسنس شرکت'],
    category: 'License Renewal Services'
  },
  {
    id: 'baladiya-tenancy',
    title: 'تمدید قرارداد اجاره شهرداری (بلدیه عمان)',
    description: 'تمدید رسمی قرارداد اجاره ملک تجاری در شهرداری عمان (بلدیه) جهت فعال نگه داشتن سجل تجاری (CR).',
    serviceFee: '۱,۵۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['کپی کروکی ملک', 'کپی کارت ملی مالک ملک', 'سجل تجاری شرکت (CR)'],
    category: 'License Renewal Services'
  },

  // 5. Car Rental Services
  {
    id: 'car-rental-daily-monthly',
    title: 'اجاره خودرو روزانه و ماهانه (اقتصادی و سواری)',
    description: 'اجاره انواع خودروهای سواری و اقتصادی به‌صورت روزانه، هفتگی و ماهانه با بیمه کامل و تحویل سریع.',
    serviceFee: '۱۲۰ درهم / روزانه',
    workingDays: 'تحویل فوری',
    requirements: ['کپی پاسپورت و ویزا', 'گواهینامه رانندگی / بین‌المللی', 'دیپوزیت / کارت اعتباری'],
    category: 'Car Rental Services'
  },
  {
    id: 'luxury-car-rental',
    title: 'اجاره خودروهای لوکس و اسپرت',
    description: 'رنت آخرین مدل خودروهای لوکس و اسپرت دنیا (لامبورگینی، فراری، رولزرویس، پورشه، بنز) برای تشریفات و قرار‌های تجاری.',
    serviceFee: '۸۰۰ درهم / روزانه',
    workingDays: 'تحویل فوری',
    requirements: ['پاسپورت و ویزای معتبر', 'گواهینامه بین‌المللی', 'ودائع تامینی (دیپوزیت)'],
    category: 'Car Rental Services'
  },
  {
    id: 'chauffeur-car-rental',
    title: 'اجاره خودرو تشریفاتی با راننده اختصاصی',
    description: 'خدمات ترانسفر لوکس با راننده مسلط به چند زبان جهت ترانسفر فرودگاهی، هیئت‌های تجاری و تورهای شهری.',
    serviceFee: '۳۵۰ درهم / ۵ ساعت',
    workingDays: 'رزرو فوری',
    requirements: ['مشخصات پرواز / آدرس مبدا', 'تعداد مسافران', 'تاییدیه رزرو'],
    category: 'Car Rental Services'
  },
  {
    id: 'suv-family-car-rental',
    title: 'اجاره خودروهای شاسی‌بلند و خانوادگی (۷ نفره)',
    description: 'خودروهای شاسی‌بلند و خانوادگی جادار برای سفرهای گروهی، گردشگری و تردد بین‌شهری با بیمه کامل بدنه.',
    serviceFee: '۲۵۰ درهم / روزانه',
    workingDays: 'تحویل فوری',
    requirements: ['کپی پاسپورت', 'گواهینامه رانندگی معتبر', 'دیپوزیت'],
    category: 'Car Rental Services'
  },

  // 6. Banking Services
  {
    id: 'business-account-high-risk',
    title: 'افتتاح حساب شرکتی - فعالیت‌های با ریسک بالا',
    description: 'افتتاح حساب بانکی تجاری برای بیزینس‌هایی با فعالیت‌های پرریسک. مدیریت کامل مدارک، تهیه پورتفولیو شرکت و قوانین انطباق بانکی.',
    serviceFee: '۳,۹۵۰ درهم',
    workingDays: '۲۰ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'ویزای کلیه شرکا باید معتبر باشد', 'الزامی جهت فرآیند تمدید اقامت'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'افتتاح حساب شرکتی - فعالیت‌های با ریسک معمولی',
    description: 'راه‌اندازی سریع حساب بانکی شرکتی برای بیزینس‌های کم‌ریسک. اخذ تاییدیه از معتبرترین بانک‌های امارات و عمان.',
    serviceFee: '۲,۹۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'ویزای کلیه شرکا باید معتبر باشد', 'الزامی جهت فرآیند تمدید اقامت'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'راهنمایی افتتاح حساب شخصی',
    description: 'افتتاح حساب بانکی شخصی پس‌انداز یا جاری در بهترین بانک‌های داخلی. ارزیابی مدارک و دریافت سریع تاییدیه افتتاح حساب.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['ویزای اقامت و کارت ملی معتبر', 'پاسپورت با مهر ورود', 'فیش حقوقی یا گواهی تمکن مالی'],
    category: 'Banking Services'
  },

  // 7. Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'ثبت‌نام مالیات شرکت‌ها (Corporate Tax)',
    description: 'ثبت‌نام رسمی شرکت در سیستم مالیاتی سازمان مالیات فدرال (FTA). جلوگیری از جریمه سنگین با ثبت‌نام در بازه قانونی.',
    serviceFee: '۱۸۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['ثبت‌نام حداکثر طی ۸۷ روز از ثبت شرکت', 'الزامی برای کلیه شرکت‌ها', 'جلوگیری از جریمه مالیاتی'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'ارسال اظهارنامه مالیاتی شرکت',
    description: 'تنظیم و ارسال اظهارنامه مالیاتی شرکت طبق استانداردهای حسابداری رسمی در مهلت قانونی جهت جلوگیری از جریمه‌های ماهانه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['ارسال در بازه حداکثر ۹ ماهه', 'الزامی برای کلیه شرکت‌های ثبت شده', 'جلوگیری از جریمه ماهانه'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'ثبت‌نام مالیات بر ارزش افزوده (VAT)',
    description: 'ثبت‌نام رسمی در پرتال مالیات بر ارزش افزوده (VAT). الزامی برای شرکت‌هایی که میزان فروش آن‌ها از حد مجاز قانونی فراتر رفته است.',
    serviceFee: '۳۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['کپی لایسنس تجاری شرکت', 'تراز مالی رسمی فروش', 'پاسپورت و ویزای مدیر شرکت'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'به‌روزرسانی پروفایل مالیاتی (FTA)',
    description: 'اصلاح و به‌روزرسانی مشخصات شرکت در پرتال سازمان مالیات پس از اعمال تغییرات لایسنس، آدرس یا مدیریت.',
    serviceFee: '۲۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اطلاعات لایسنس باید به‌روز باشد', 'ویزای مدیر مسئول باید به‌روز باشد', 'محل شرکت باید به روز باشد'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'درخواست بازنگری جرایم مالیاتی',
    description: 'ثبت رسمی درخواست تجدیدنظر و بخشش جرایم مالیاتی طبق قوانین رسمی. تنظیم لوایح دفاعی قانونی جهت معافیت از جریمه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اعتراض به جرایم صادره مالیاتی', 'بررسی بر اساس قوانین سازمان مالیاتی', 'تنظیم لایحه دفاعی'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'اخذ معافیت‌های مالیاتی صنعتی',
    description: 'اخذ گواهی رسمی معافیت‌های مالیاتی صنعتی برای تجهیزات، ماشین‌آلات تولیدی و مواد اولیه جهت کاهش هزینه‌های کارخانه‌ها.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۱۰ روز کاری',
    requirements: ['کپی لایسنس صنعتی معتبر', 'لیست تجهیزات و مواد اولیه وارداتی', 'مجوز زیست‌محیطی معتبر'],
    category: 'Tax Services'
  },

  // 8. General Government Services
  {
    id: 'driving-license-guidance',
    title: 'گواهینامه رانندگی',
    description: 'کمک گام‌به‌گام برای تبدیل گواهینامه معتبر یا باز کردن پرونده جدید رانندگی. هماهنگی تست چشم و نوبت‌های اداری.',
    serviceFee: '۳۵۰ درهم',
    governmentFees: '۸۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کارت ملی معتبر', 'اصل گواهینامه رانندگی کشور مبدا', 'گواهی معاینه چشم معتبر'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'مجوزهای شهرداری دبی',
    description: 'اخذ مجوزهای تجاری، تبلیغاتی یا دکوراسیون اداری از شهرداری دبی. پیگیری تایید نقشه‌های فنی.',
    serviceFee: '۶۵۰ درهم',
    governmentFees: 'از ۱,۵۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'قرارداد ایجاری معتبر', 'نقشه جانمایی دفتر یا مغازه'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'مجوزهای شورای ورزشی دبی',
    description: 'اخذ تاییدیه و مجوزهای رسمی فعالیت باشگاه‌ها، مسابقات ورزشی و آکادمی‌های ورزشی از شورای ورزشی دبی.',
    serviceFee: '۸۵۰ درهم',
    governmentFees: 'از ۲,۵۰۰ درهم',
    workingDays: '۷ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'مدارک و مدارک مربیگری', 'گواهی ایمنی مکان ورزشی'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'مجوزهای املاک (RERA)',
    description: 'اخذ مجوزهای فعالیت‌های تجاری املاک، کارت کارگزاری و مجوزهای تبلیغات ملک از دپارتمان املاک (RERA).',
    serviceFee: '۹۵۰ درهم',
    governmentFees: 'از ۳,۵۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'کارت کارگزاری مدیر', 'قرارداد دفتر تجاری'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'ترخیص گمرکی بیان (Bayan)',
    description: 'ترخیص کالا و مرسولات گمرکی در عمان از طریق سیستم رسمی گمرک بیان جهت تسریع ترخیص در بنادر.',
    serviceFee: '۴۵۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس صادرات/واردات', 'فاکتور تجاری و پکینگ لیست', 'گواهی مبدا کالا'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'گواهی ساخت عمان (Made in Oman)',
    description: 'اخذ گواهی کیفیت رسمی "ساخت عمان" برای محصولات تولیدی داخلی جهت بهره‌مندی از اولویت مناقصات.',
    serviceFee: '۵۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['کپی لایسنس صنعتی/تجاری', 'تاییدیه ارزش افزوده داخلی', 'گزارش تست محصول'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'کارت ریاده (Riyada Card)',
    description: 'خدمات دریافت کارت ریاده برای کسب‌وکارهای کوچک و متوسط (SME) در عمان جهت بهره‌مندی از معافیت‌ها و مناقصات.',
    serviceFee: '۲۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['اثبات مالکیت عمانی', 'لایسنس تجاری معتبر', 'ثبت‌نام فعال بیمه تامین اجتماعی'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'مجوز ایمنی دفاع مدنی (PACDA)',
    description: 'اخذ تاییدیه‌های ایمنی آتش‌نشانی و مجوزهای ایمنی شهری از سازمان دفاع مدنی و آمبولانس.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'از ۱,۰۰۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'قرارداد اجاره ملک', 'گواهی تجهیزات اطفاء حریق'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'گواهی استاندارد محصول',
    description: 'اخذ تاییدیه‌های رسمی استاندارد و گواهی علامت کیفیت G-mark از اداره کل استاندارد.',
    serviceFee: '۵۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['مشخصات فنی محصول', 'کپی گواهی‌های ایزو', 'لایسنس واردات/صادرات'],
    category: 'General Government Services'
  },
  {
    id: 'government-land-rental',
    title: 'راهنمایی اجاره زمین دولتی',
    description: 'راهنمایی گام‌به‌گام دریافت زمین‌های اجاره‌ای دولتی برای پروژه‌های صنعتی، انبارداری و کشاورزی در شهرک‌های صنعتی.',
    serviceFee: '۹۵۰ درهم',
    workingDays: '۱۰ روز کاری',
    requirements: ['لایسنس صنعتی/تجاری معتبر', 'خلاصه طرح توجیهی', 'درخواست رسمی به وزارتخانه'],
    category: 'General Government Services'
  },
  {
    id: 'accounting-auditing',
    title: 'خدمات حسابداری و حسابرسی',
    description: 'دفترنویسی حرفه‌ای، تنظیم صورت‌های مالی، حسابرسی سالانه و بررسی دفاتر جهت انطباق با قوانین مالی.',
    serviceFee: '۴۵۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['دفاتر و پرینت حساب شرکت', 'لیست فاکتورهای رسمی', 'مدارک هزینه‌ها'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'مدیریت عمان‌سازی و استخدامی',
    description: 'تنظیم دقیق نسبت استخدام نیروی کار بومی و خارجی طبق استانداردهای رسمی وزارت کار جهت جلوگیری از مسدودی پرتال.',
    serviceFee: '۶۵۰ درهم',
    workingDays: '۴ روز کاری',
    requirements: ['کپی لایسنس شرکت', 'لیست ویزاهای فعال پرسنل', 'هدف‌گذاری نسبت عمان‌سازی'],
    category: 'General Government Services'
  },
  {
    id: 'icv-certificate',
    title: 'گواهی ارزش افزوده داخلی (ICV)',
    description: 'آماده‌سازی و اخذ گواهی رسمی ICV عمان جهت شرکت در مناقصات بزرگ دولتی و نفت و گاز.',
    serviceFee: '۱,۵۰۰ درهم',
    workingDays: '۷ روز کاری',
    requirements: ['صورت‌های مالی حسابرسی شده', 'گزارش عمان‌سازی', 'فاکتورهای خرید داخلی'],
    category: 'General Government Services'
  }
];

// ─── ARABIC SERVICES LIST ───────────────────────────────────────────────────
export const servicesListAR: Service[] = [
  // 1. Company Setup Services
  {
    id: 'company-mainland',
    title: 'تأسيس شركة في البر الرئيسي (Mainland)',
    description: 'تأسيس شركة في البر الرئيسي للإمارات أو عمان بملكية أجنبية 100%. حجز الاسم التجاري والموافقات الأولية وتوقيع عقد التأسيس.',
    serviceFee: '3,000 درهم',
    governmentFees: 'من 12,000 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة جواز السفر', 'صورة التأشيرة السياحية / ختم الدخول', 'ثلاثة أسماء تجارية مقترحة'],
    category: 'Company Setup Services'
  },
  {
    id: 'company-freezone',
    title: 'تأسيس شركة في المنطقة الحرة (Freezone)',
    description: 'تأسيس أعمالك في أفضل المناطق الحرة مع معافاة ضريبية 100% وملكية كاملة دون الحاجة لشريك محلي. تشمل الرخصة وعقد الإيجار.',
    serviceFee: '2,500 درهم',
    governmentFees: 'من 9,500 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['صورة جواز السفر', 'صورة شخصية خلفية بيضاء', 'قائمة الأنشطة التجارية المقترحة'],
    category: 'Company Setup Services'
  },
  {
    id: 'trademark-registration',
    title: 'تسجيل العلامة التجارية',
    description: 'حماية هوية علامتك التجارية قانونياً. إجراء الاستعلام المسبق، تقديم الطلب في وزارة الاقتصاد، وإصدار شهادة التسجيل.',
    serviceFee: '1,500 درهم',
    governmentFees: '7,500 درهم',
    workingDays: '15 يوم عمل',
    requirements: ['شعار العلامة التجارية', 'صورة الرخصة التجارية', 'وكالة رسمية'],
    category: 'Company Setup Services'
  },
  {
    id: 'business-setup-consulting',
    title: 'استشارات تأسيس الأعمال',
    description: 'استشارات متخصصة في هيكلة الشركات وتوزيع الحصص وتحديد الأنشطة التجارية والاختيار الأمثل للموقع.',
    serviceFee: '500 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['وصف فكرة المشروع', 'تخطيط رأس المال الأول', 'اقتراح موقع الشركة'],
    category: 'Company Setup Services'
  },
  {
    id: 'feasibility-study',
    title: 'دراسة الجدوى وخطة العمل الرسمية',
    description: 'إعداد دراسات جدوى وافية وخطط عمل احترافية مخصصة للتقديم للبنوك والجهات الحكومية وجذب المستثمرين.',
    serviceFee: '1,500 درهم',
    workingDays: '8 أيام عمل',
    requirements: ['وصف نموذج العمل', 'التقديرات المالية والمبيعات', 'معلومات المنافسين والظروف السوقية'],
    category: 'Company Setup Services'
  },

  // 2. Family & Business Visas
  {
    id: 'family-residency-visa',
    title: 'تأشيرة الإقامة العائلية',
    description: 'إصدار وتجديد إقامة الزوجة والأبناء والوالدين. تشمل توثيق المستندات والفحص الطبي وبطاقة الهوية وتثبيت التأشيرة.',
    serviceFee: '450 درهم',
    governmentFees: '1,340 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة جواز إقامة الكفيل', 'توثيق عقد الزواج / شهادات الميلاد', 'شهادة الراتب / عقد إيجاري'],
    category: 'Family & Business Visas'
  },
  {
    id: 'partner-investor-visa',
    title: 'تأشيرة الشريك والمستثمر',
    description: 'إصدار وتجديد إقامة المستثمر والشريك التجاري لأصحاب الأعمال والمساهمين مع كافة الامتيازات القانونية.',
    serviceFee: '650 درهم',
    governmentFees: '3,200 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'عقد التأسيس (MOA/CR)', 'صورة جواز السفر للشريك'],
    category: 'Family & Business Visas'
  },
  {
    id: 'business-employment-visa',
    title: 'تأشيرات العمل والموظفين',
    description: 'إصدار تصاريح العمل وتأشيرات التوظيف لموظفي ومستنجدي الشركات في المناطق الحرة والبر الرئيسي.',
    serviceFee: '350 درهم',
    governmentFees: '1,850 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'بطاقة المنشأة', 'صورة شخصية وجواز الموظف'],
    category: 'Family & Business Visas'
  },
  {
    id: 'golden-visa-services',
    title: 'خدمات الإقامة الذهبية (10 سنوات)',
    description: 'إجراءات الترشيح وإصدار الإقامة الذهبية لمدة 10 سنوات للمستثمرين ورواد الأعمال والرؤساء التنفيذيين والموهوبين.',
    serviceFee: '1,500 درهم',
    governmentFees: '4,800 درهم',
    workingDays: '7 أيام عمل',
    requirements: ['كشف حساب / ملكية عقار / رخصة تجارية', 'صورة جواز السفر', 'الهوية / تصريح الدخول'],
    category: 'Family & Business Visas'
  },

  // 3. Tourist Visa Extension Services
  {
    id: 'tourist-visa-30-days',
    title: 'تجديد التأشيرة السياحية 30 يوماً',
    description: 'تجديد سريع وسلس للتأشيرة السياحية لمدة 30 يوماً عبر البوابات الرسمية للهجرة لضمان الوضع القانوني.',
    serviceFee: '290 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['صورة جواز السفر', 'صورة التأشيرة السياحية الحالية', 'صورة شخصية'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'تجديد التأشيرة السياحية 60 يوماً',
    description: 'تجديد التأشيرة السياحية لمدة 60 يوماً للإقامات الطويلة أو متابعة المعاملات التجارية والأسرية.',
    serviceFee: '490 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['صورة جواز السفر', 'صورة التأشيرة السياحية الحالية', 'صورة شخصية'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'تجديد التأشيرة 60 يوماً متعددة الدخول',
    description: 'تجديد سريع للتأشيرة متعددة الدخول لمدة 60 يوماً لرجال الأعمال والمسافرين بشكل متكرر.',
    serviceFee: '790 درهم',
    workingDays: '1 يوم عمل',
    requirements: ['صورة جواز السفر', 'صورة التأشيرة السياحية الحالية', 'صورة شخصية'],
    category: 'Tourist Visa Extension Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تجديد التأشيرة من داخل الدولة (بدون مغادرة)',
    description: 'تعديل الوضع وتجديد التأشيرة السياحية من داخل الدولة دون الحاجة للمغادرة حتى 4 أشهر إجمالاً.',
    serviceFee: '1,090 درهم',
    workingDays: '1 يوم عمل',
    requirements: ['صورة جواز السفر', 'صورة التأشيرة السياحية الحالية', 'صورة شخصية'],
    category: 'Tourist Visa Extension Services'
  },

  // 4. License Renewal Services
  {
    id: 'trade-license-renewal',
    title: 'تجديد الرخصة التجارية (Mainland & Freezone)',
    description: 'تجديد الرخص التجارية للشركات وإصدار إذن الدفع الإلكتروني وتوثيق عقود الإيجار لتفادي الغرامات.',
    serviceFee: '300 درهم',
    governmentFees: 'من 4,270 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['عقد إيجاري / بلدي ساري', 'بطاقة المنشأة سارية المفعول', 'الموافقة على إذن الدفع'],
    category: 'License Renewal Services'
  },
  {
    id: 'establishment-card-renewal',
    title: 'تجديد بطاقة المنشأة وغرفة التجارة',
    description: 'تجديد بطاقة المنشأة والانتساب لغرفة التجارة لضمان استمرارية المعاملات وتصاريح العمل.',
    serviceFee: '150 درهم',
    governmentFees: '581 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['صورة الرخصة التجارية', 'الهوية الأصلية للمفوض', 'السجل التجاري للشركة'],
    category: 'License Renewal Services'
  },
  {
    id: 'ejari-1-year',
    title: 'تجديد عقد الإيجاري السنوي',
    description: 'تسجيل وتجديد عقد الإيجاري السنوي الرسمي للمكاتب والمحلات والمستودعات لاستيفاء متطلبات البلدية.',
    serviceFee: '1,950 درهم',
    workingDays: '1 يوم عمل',
    requirements: ['صورة ملكية العقار', 'صورة هوية المؤجر', 'صورة الرخصة التجارية'],
    category: 'License Renewal Services'
  },
  {
    id: 'baladiya-tenancy',
    title: 'تجديد عقد الإيجار البلدي (عمان)',
    description: 'تجديد عقد الإيجار التجاري في بلدية عمان لضمان استمرار السجل التجاري والأنشطة.',
    serviceFee: '1,500 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['صورة الرسم المساحي (الكروكي)', 'صورة الهوية للمؤجر', 'السجل التجاري (CR)'],
    category: 'License Renewal Services'
  },

  // 5. Car Rental Services
  {
    id: 'car-rental-daily-monthly',
    title: 'تأجير السيارات اليومي والشهري',
    description: 'تأجير مختلف أنواع السيارات الاقتصادية والسيدان بشكل يومي أو أسبوعي أو شهري مع التأمين الشامل والتسليم السريع.',
    serviceFee: '120 درهم / يومياً',
    workingDays: 'تسليم فوري',
    requirements: ['صورة الجواز والتأشيرة', 'رخصة القيادة / الدولية', 'مبلغ التأمين / بطاقة ائتمان'],
    category: 'Car Rental Services'
  },
  {
    id: 'luxury-car-rental',
    title: 'تأجير السيارات الفارهة والرياضية',
    description: 'استئجار أحدث موديلات السيارات الفاخرة والرياضية (لامبورغيني، فيراري، رولز رويس، بورش، مرسيدس) للمناسبات والوفود.',
    serviceFee: '800 درهم / يومياً',
    workingDays: 'تسليم فوري',
    requirements: ['جواز وتأشيرة سارية', 'رخصة قيادة دولية', 'وديعة تأمين'],
    category: 'Car Rental Services'
  },
  {
    id: 'chauffeur-car-rental',
    title: 'تأجير السيارات الفاخرة مع سائق خاص',
    description: 'خدمات التنقل الفاخرة مع سائقين خاصين يتحدثون لغات متعددة للتوصيل من وإلى المطار والجولات التجارية.',
    serviceFee: '350 درهم / 5 ساعات',
    workingDays: 'حجز فوري',
    requirements: ['تفاصيل الرحلة / عنوان الاستلام', 'عدد الراكبين', 'تأكيد الحجز'],
    category: 'Car Rental Services'
  },
  {
    id: 'suv-family-car-rental',
    title: 'تأجير السيارات العائلية والدفع الرباعي',
    description: 'سيارات الدفع الرباعي والعائلية واسعة (7 ركاب) للتنقلات الجماعية والرحلات بين المدن مع تأمين شامل.',
    serviceFee: '250 درهم / يومياً',
    workingDays: 'تسليم فوري',
    requirements: ['صورة جواز السفر', 'رخصة قيادة سارية', 'تأمين'],
    category: 'Car Rental Services'
  },

  // 6. Banking Services
  {
    id: 'business-account-high-risk',
    title: 'فتح حساب شركتاً - أنشطة عالية المخاطر',
    description: 'فتح حسابات بنكية تجارية للقطاعات عالية المخاطر مع إدارة الامتثال والتدقيق وتنسيق المعاملات مع البنوك.',
    serviceFee: '3,950 درهم',
    workingDays: '20 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'تأشيرة جميع الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'فتح حساب شركتاً - أنشطة منخفضة المخاطر',
    description: 'تسهيل فتح الحسابات البنكية التجارية للأنشطة منخفضة المخاطر بسرعة لدى أفضل البنوك المحلية والدولية.',
    serviceFee: '2,950 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'تأشيرة جميع الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },
  {
    id: 'personal-account-guidance',
    title: 'إرشادات فتح الحساب الشخصي',
    description: 'فتح حساب شخصي جاري أو توفير لدى أفضل البنوك مع مراجعة المستندات واستخراج الموافقات السريعة.',
    serviceFee: '950 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['تأشيرة إقامة وهوية سارية', 'جواز السفر مع ختم الدخول', 'شهادة الراتب أو إثبات الدخل'],
    category: 'Banking Services'
  },

  // 7. Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'التسجيل في ضريبة الشركات (Corporate Tax)',
    description: 'التسجيل الرسمي للشركة لدى الهيئة الاتحادية للضرائب لتفادي الغرامات المالية بالتسجيل في المواعيد المحددة.',
    serviceFee: '180 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['التسجيل خلال 87 يوماً', 'إلزامي لجميع الشركات', 'تفادي الغرامة المالية'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'تقديم الإقرار الضريبي للشركات',
    description: 'إعداد وتقديم الإقرارات الضريبية وفق المعايير المعتمدة خلال المهلة القانونية لتفادي الغرامات الشهرية.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['التقديم خلال 9 أشهر', 'إلزامي لجميع الشركات المسجلة', 'تفادي الغرامة الشهرية'],
    category: 'Tax Services'
  },
  {
    id: 'vat-registration',
    title: 'التسجيل في ضريبة القيمة المضافة (VAT)',
    description: 'التسجيل الرسمي في بوابة ضريبة القيمة المضافة للشركات التي تتجاوز إيراداتها الحد القانوني الخاضع للضريبة.',
    serviceFee: '350 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'كشف الحساب المالي المعتمد', 'جواز وتأشيرة المدير'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'تحديث الملف الضريبي (FTA)',
    description: 'تعديل وتحديث البيانات الرسمية لدى الهيئة الاتحادية للضرائب بعد تعديل الرخصة أو العنوان أو الإدارة.',
    serviceFee: '280 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['تحديث بيانات الرخصة أولاً', 'تحديث تأشيرة المدير المسؤول', 'تحديث موقع وعنوان الشركة'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'طلب إعادة النظر في الغرامات الضريبية',
    description: 'تقديم طلبات التظلم وإعادة النظر الرسمية في الغرامات الضريبية وفق القوانين واللوائح التنفيذية.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['تقديم طلب تظلم من الغرامة', 'الصياغة وفق القوانين الضريبية', 'دراسة قانونية للطلب'],
    category: 'Tax Services'
  },
  {
    id: 'industrial-tax-exemptions',
    title: 'الإعفاءات الضريبية الصناعية',
    description: 'الحصول على شهادات الإعفاء الضريبي الصناعي للمعدات والآلات والمواد الخام لتخفيض التكاليف الإنتاجية.',
    serviceFee: '950 درهم',
    workingDays: '10 أيام عمل',
    requirements: ['صورة الرخصة الصناعية', 'قائمة المعدات والمواد الخام', 'الموافقة البيئية'],
    category: 'Tax Services'
  },

  // 8. General Government Services
  {
    id: 'driving-license-guidance',
    title: 'إرشادات رخصة القيادة',
    description: 'مساعدة خطوة بخطوة لتحويل رخصة القيادة الأصلية أو فتح ملف جديد وتنسيق فحوصات النظر والمواعيد.',
    serviceFee: '350 درهم',
    governmentFees: '850 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['بطاقة الهوية السارية', 'رخصة القيادة الأصلية من البلد الأم', 'فحص نظر معتمد'],
    category: 'General Government Services'
  },
  {
    id: 'dubai-municipality-permits',
    title: 'تصاريح بلدية دبي',
    description: 'استخراج التصاريح التجارية والإعلانية وتصاريح الديكور الداخلي من بلدية دبي واعتماد المخططات الفنية.',
    serviceFee: '650 درهم',
    governmentFees: 'من 1,500 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'عقد إيجاري ساري', 'مخطط التصميم الداخلي'],
    category: 'General Government Services'
  },
  {
    id: 'sports-council-permits',
    title: 'تصاريح مجلس دبي الرياضي',
    description: 'الحصول على الموافقات والتصاريح الرسمية للأكاديميات والفعاليات والأندية الرياضية من مجلس دبي الرياضي.',
    serviceFee: '850 درهم',
    governmentFees: 'من 2,500 درهم',
    workingDays: '7 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'شهادات مؤهلات المدربين', 'شهادة سلامة المقر'],
    category: 'General Government Services'
  },
  {
    id: 'rera-permits',
    title: 'تصاريح مؤسسة التنظيم العقاري (RERA)',
    description: 'استخراج تصاريح الأنشطة العقارية وبطاقات الوساطة وتصاريح الإعلانات العقارية من مؤسسة RERA.',
    serviceFee: '950 درهم',
    governmentFees: 'من 3,500 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'بطاقة الوسيط للمدير', 'عقد إيجار المكتب'],
    category: 'General Government Services'
  },
  {
    id: 'customs-bayan',
    title: 'التخليص الجمركي (بيان)',
    description: 'تخليص البضائع والشحنات الجمركية عبر نظام بيان الجمركي الرسمي لسرعة الإفراج في الموانئ.',
    serviceFee: '450 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['رخصة الاستيراد والتصدير', 'الفاتورة التجارية وقائمة التعبئة', 'شهادة المنشأ'],
    category: 'General Government Services'
  },
  {
    id: 'made-in-oman',
    title: 'شهادة صنع في عمان',
    description: 'الحصول على شهادة الجودة الرسمية "صنع في عمان" للمنتجات المصنعة محلياً للاستفادة من أولوية التوريد.',
    serviceFee: '550 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['صورة الرخصة الصناعية/التجارية', 'إثبات القيمة المضافة المحلية', 'تقرير فحص المنتج'],
    category: 'General Government Services'
  },
  {
    id: 'riyada-card',
    title: 'بطاقة ريادة الأعمال (ريادة)',
    description: 'خدمات استخراج بطاقة ريادة الأعمال للمؤسسات الصغيرة والمتوسطة للاستفادة من التسهيلات والمناقصات.',
    serviceFee: '250 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['إثبات الملكية العمانية', 'رخصة تجارية سارية', 'تسجيل التأمينات الاجتماعية النشط'],
    category: 'General Government Services'
  },
  {
    id: 'pacda-permits',
    title: 'تصاريح السلامة للدفاع المدني (PACDA)',
    description: 'استخراج موافقات الوقاية وتصاريح السلامة من هيئة الدفاع المدني والإسعاف للمحلات والمكاتب.',
    serviceFee: '450 درهم',
    governmentFees: 'من 1,000 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'عقد إيجار العقار', 'شهادة معدات الإطفاء'],
    category: 'General Government Services'
  },
  {
    id: 'product-standards',
    title: 'شهادات مطابقة المنتجات',
    description: 'الحصول على موافقات المواصفات وشهادات شارة المطابقة الخليجية G-mark من المديرية العامة للمواصفات.',
    serviceFee: '550 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['كتيب المواصفات الفنية', 'نسخة شهادات الأيزو', 'رخصة الاستيراد/التصدير'],
    category: 'General Government Services'
  },
  {
    id: 'government-land-rental',
    title: 'إرشادات استئجار الأراضي الحكومية',
    description: 'مساعدة شاملة للحصول على الأراضي الحكومية المستأجرة للأغراض الصناعية والمستودعات في المدن الصناعية.',
    serviceFee: '950 درهم',
    workingDays: '10 أيام عمل',
    requirements: ['رخصة صناعية/تجارية سارية', 'ملخص دراسة الجدوى', 'رسالة طلب رسمية للوزارة'],
    category: 'General Government Services'
  },
  {
    id: 'accounting-auditing',
    title: 'خدمات المحاسبة والتدقيق',
    description: 'مسك الدفاتر المحاسبية وإعداد القوائم المالية والتدقيق السنوي لضمان الامتثال للأنظمة المالية.',
    serviceFee: '450 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['دفاتر وكشوفات حساب الشركة', 'قائمة الفواتير الضريبية', 'مستندات المصاريف'],
    category: 'General Government Services'
  },
  {
    id: 'omanisation-management',
    title: 'إدارة التعمين والتوظيف',
    description: 'ضبط واستيفاء نسب التعمين والتوظيف طبقاً للاشتراطات الرسمية لوزارة العمل لتجنب حظر المعاملات.',
    serviceFee: '650 درهم',
    workingDays: '4 أيام عمل',
    requirements: ['صورة الرخصة التجارية', 'قائمة تأشيرات الموظفين', 'نسبة التعمين المستهدفة'],
    category: 'General Government Services'
  },
  {
    id: 'icv-certificate',
    title: 'شهادة القيمة المضافة المحلية (ICV)',
    description: 'إعداد واقتناص شهادة ICV الرسمية للشركات للتنافس في المناقصات الحكومية وشركات النفط والغاز.',
    serviceFee: '1,500 درهم',
    workingDays: '7 أيام عمل',
    requirements: ['القوائم المالية المدققة', 'تقرير نسبة التعمين', 'فواتير الشراء المحلية'],
    category: 'General Government Services'
  }
];

// ─── MASTER ID LISTS ─────────────────────────────────────────────────────────
export const uaeServiceIds = [
  'company-mainland',
  'company-freezone',
  'trademark-registration',
  'family-residency-visa',
  'partner-investor-visa',
  'business-employment-visa',
  'golden-visa-services',
  'tourist-visa-30-days',
  'tourist-visa-60-days',
  'tourist-visa-multi-60-days',
  'tourist-visa-renewal',
  'trade-license-renewal',
  'establishment-card-renewal',
  'ejari-1-year',
  'car-rental-daily-monthly',
  'luxury-car-rental',
  'chauffeur-car-rental',
  'suv-family-car-rental',
  'business-account-high-risk',
  'business-account-low-risk',
  'personal-account-guidance',
  'corporate-tax-registration',
  'corporate-tax-filing',
  'vat-registration',
  'fta-profile-update',
  'tax-reconsideration',
  'driving-license-guidance',
  'dubai-municipality-permits',
  'sports-council-permits',
  'rera-permits'
];

export const omanServiceIds = [
  'company-mainland',
  'company-freezone',
  'trademark-registration',
  'business-setup-consulting',
  'feasibility-study',
  'family-residency-visa',
  'partner-investor-visa',
  'business-employment-visa',
  'golden-visa-services',
  'tourist-visa-30-days',
  'tourist-visa-60-days',
  'tourist-visa-multi-60-days',
  'tourist-visa-renewal',
  'trade-license-renewal',
  'establishment-card-renewal',
  'baladiya-tenancy',
  'car-rental-daily-monthly',
  'luxury-car-rental',
  'chauffeur-car-rental',
  'suv-family-car-rental',
  'business-account-high-risk',
  'business-account-low-risk',
  'personal-account-guidance',
  'corporate-tax-registration',
  'corporate-tax-filing',
  'vat-registration',
  'fta-profile-update',
  'tax-reconsideration',
  'industrial-tax-exemptions',
  'driving-license-guidance',
  'customs-bayan',
  'made-in-oman',
  'icv-certificate',
  'riyada-card',
  'pacda-permits',
  'product-standards',
  'government-land-rental',
  'accounting-auditing',
  'omanisation-management'
];

// Helper function to map AED services list to OMR for Oman
export function convertToOmanServices(services: Service[], language: Language): Service[] {
  const toEnglishDigits = (str: string): string => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let normalized = str;
    for (let i = 0; i < 10; i++) {
      normalized = normalized.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
    }
    return normalized;
  };

  // Filter only services that belong to Oman
  const omanServices = services.filter(s => omanServiceIds.includes(s.id));

  return omanServices.map(service => {
    const updated = { ...service };

    // Customize shared services for Oman specifically
    if (updated.id === 'establishment-card-renewal') {
      if (language === 'fa') {
        updated.title = 'تمدید سجل تجاری و کارت بازرگانی';
        updated.description = 'تمدید به موقع سجل تجاری و کارت عضویت اتاق بازرگانی عمان جهت حفظ وضعیت قانونی و تسهیل کلیه امور اداری و استخدامی.';
        updated.requirements = ['سجل تجاری (CR) باید معتبر باشد', 'نیاز به کارت بازرگانی معتبر', 'نیاز به کارت ملی فیزیکی عمان (Civil ID)'];
      } else if (language === 'ar') {
        updated.title = 'تجديد السجل التجاري وغرفة التجارة';
        updated.description = 'تجديد السجل التجاري وبطاقة الانتساب لغرفة تجارة وصناعة عمان لضمان توافق الشركة القانوني وتجنب الغرامات أو تعطل المعاملات.';
        updated.requirements = ['يجب أن يكون السجل التجاري سارياً', 'بطاقة الغرفة التجارية مطلوبة', 'الهوية العمانية الأصلية للمفوض بالتوقيع'];
      } else {
        updated.title = 'Commercial CR & Chamber Card Renewal';
        updated.description = 'Timely renewal of your Commercial Registration (CR) and Chamber of Commerce card in Oman to maintain legal compliance and prevent operational blocks.';
        updated.requirements = ['CR Must be Valid', 'Chamber Card Must be Active', 'Physical Oman ID Required'];
      }
    } else if (updated.id === 'trade-license-renewal') {
      if (language === 'fa') {
        updated.title = 'تمدید مجوز بلدیه (شهرداری) و تجاری';
        updated.description = 'تمدید مجوزهای فعالیت تجاری از شهرداری عمان (بلدیه) و تاییدیه محیط زیست جهت تداوم قانونی کسب‌وکار.';
        updated.requirements = ['عقد اجاره بلدیه معتبر', 'سجل تجاری فعال شرکت', 'تاییدیه دفاع مدنی (PACDA) در صورت نیاز'];
      } else if (language === 'ar') {
        updated.title = 'تجديد الترخيص البلدي والأنشطة';
        updated.description = 'تجديد التراخيص البلدية والأنشطة التجارية في عمان لضمان الامتثال التام مع لوائح وزارة البلديات الإقليمية وموارد المياه.';
        updated.requirements = ['عقد إيجار بلدي ساري المفعول', 'سجل تجاري نشط', 'موافقة الدفاع المدني عند الحاجة'];
      } else {
        updated.title = 'Municipal & Activity License Renewal';
        updated.description = 'Renew your Oman Municipality (Baladiya) license and registered commercial activities to prevent operational fines and penalties.';
        updated.requirements = ['Valid Baladiya Tenancy Contract', 'Active CR Registration', 'PACDA Approval (If applicable)'];
      }
    } else if (updated.id === 'driving-license-guidance') {
      if (language === 'fa') {
        updated.title = 'راهنمایی دریافت گواهینامه رانندگی عمان';
        updated.description = 'کمک گام‌به‌گام برای تبدیل گواهینامه معتبر یا باز کردن پرونده جدید در پلیس سلطنتی عمان (ROP). هماهنگی تست چشم و نوبت‌های اداری.';
        updated.requirements = ['کارت ملی معتبر عمان (Civil ID)', 'اصل گواهینامه رانندگی کشور مبدا', 'گواهی معاینه چشم معتبر عمان'];
      } else if (language === 'ar') {
        updated.title = 'إرشادات الحصول على رخصة القيادة العمانية';
        updated.description = 'مساعدة شاملة لتحويل رخصة قيادتكم الأصلية أو فتح ملف جديد لدى شرطة عمان السلطانية (ROP). تشمل فحوصات النظر ومواعيد الفحص.';
        updated.requirements = ['بطاقة شخصية عمانية سارية', 'رخصة القيادة الأصلية من البلد الأم', 'فحص نظر معتمد في عمان'];
      } else {
        updated.title = 'Oman Driving License Guidance';
        updated.description = 'Step-by-step guidance for converting your home country driving license or starting a new file. We coordinate eye tests and ROP appointments.';
        updated.requirements = ['Valid Oman Civil ID', 'Original Home Country License', 'Oman Eye Test Certificate'];
      }
    } else if (updated.id === 'corporate-tax-registration') {
      if (language === 'fa') {
        updated.description = 'ثبت‌نام رسمی شرکت در سیستم مالیاتی سازمان امور مالیاتی عمان جهت انجام وظایف قانونی مالیات بر درآمد و جلوگیری از جرایم عدم ثبت‌نام.';
        updated.requirements = ['الزامی برای کلیه شرکت‌های فعال', 'ثبت‌نام در پرتال رسمی مالیاتی عمان', 'جلوگیری از جرایم مالیاتی'];
      } else if (language === 'ar') {
        updated.description = 'التسجيل الرسمي للشركة في النظام الضريبي لدى جهاز الضرائب بسلطنة عمان لتفادي الغرامات والعقوبات القانونية بالالتزام بالتسجيل في المواعيد الرسمية.';
        updated.requirements = ['إلزامي لجميع الشركات والمؤسسات', 'التسجيل في جهاز الضرائب العماني', 'تفادي الغرامات والعقوبات'];
      } else {
        updated.description = 'Official corporate tax registration with the Oman Tax Authority (TA). Avoid legal penalties by registering within the required regulatory timeframe.';
        updated.requirements = ['Mandatory For all Companies', 'Oman Tax Registration', 'Avoid Penalties'];
      }
    } else if (updated.id === 'fta-profile-update') {
      if (language === 'fa') {
        updated.title = 'به‌روزرسانی پروفایل سازمان امور مالیاتی';
        updated.description = 'اصلاح و به‌روزرسانی مشخصات و مدارک شرکت در پرتال سازمان امور مالیاتی عمان پس از اعمال تغییرات سجل تجاری، آدرس یا مدیریت جهت جلوگیری از تعلیق پرونده.';
        updated.requirements = ['اطلاعات سجل تجاری باید به‌روز باشد', 'کارت ملی مدیر مسئول باید به‌روز باشد', 'محل دقیق شرکت باید ثبت و به‌روز باشد'];
      } else if (language === 'ar') {
        updated.title = 'تحديث ملف جهاز الضرائب';
        updated.description = 'تعديل وتحديث بيانات شركتكم الرسمية على بوابة جهاز الضرائب العماني بعد تعديل السجل التجاري أو الإدارة أو المقر لتجنب تعليق الملف.';
        updated.requirements = ['يجب تحديث بيانات السجل التجاري أولاً', 'يجب تحديث البطاقة الشخصية للمدير المسؤول', 'يجب تحديث موقع وعنوان مقر الشركة'];
      } else {
        updated.title = 'Tax Authority Profile Update';
        updated.description = 'Official update of your Oman Tax Authority profile following updates in commercial registration, managing partners, or company office location to prevent portal issues.';
        updated.requirements = ['CR Info Must Be Updated', 'Manager ID Must Be Updated', 'Company Location Must Be Updated'];
      }
    } else if (updated.id === 'tax-reconsideration') {
      if (language === 'fa') {
        updated.description = 'ثبت رسمی درخواست تجدیدنظر و بخشش جرایم مالیاتی طبق قوانین مالیاتی عمان. تنظیم لوایح دفاعی قانونی جهت افزایش شانس معافیت از جریمه.';
        updated.requirements = ['اعتراض به جرایم صادره مالیاتی', 'عدم تضمین ۱۰۰٪ بخشش (بستگی به قوانین دارد)', 'تنظیم لایحه بر اساس قوانین رسمی عمان'];
      } else if (language === 'ar') {
        updated.description = 'تقديم طلب إعادة نظر رسمي في الغرامات المفروضة من جهاز الضرائب العماني، وصياغة الدفوع القانونية المناسبة لزيادة فرص الإعفاء أو التخفيض.';
        updated.requirements = ['تقديم طلب تظلم من الغرامات', 'الموافقة على الإعفاء غير مضمونة (حسب الحالة)', 'الصياغة وفق قوانين جهاز الضرائب العماني'];
      } else {
        updated.description = 'Submit professional appeals and waiver requests for tax penalties under Oman tax laws. We draft robust legal arguments to maximize penalty waiver success.';
        updated.requirements = ['Penalty Reconsideration', 'Waiving is Not Guaranteed', 'According to Oman Tax Laws'];
      }
    }

    // Convert prices
    const convertPrice = (priceStr?: string): string | undefined => {
      if (!priceStr) return undefined;
      const normalizedStr = toEnglishDigits(priceStr);
      const numMatch = normalizedStr.replace(/,/g, '').match(/\d+/);
      if (!numMatch) return priceStr;
      
      const numVal = parseInt(numMatch[0], 10);
      const omarVal = Math.round(numVal / 10);
      const formattedOmar = omarVal.toLocaleString('en-US');
      
      if (language === 'fa') {
        const faDigits = formattedOmar.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
        return priceStr.toLowerCase().includes('from') || priceStr.includes('از')
          ? `از ${faDigits} ریال عمان`
          : `${faDigits} ریال عمان`;
      } else if (language === 'ar') {
        return priceStr.toLowerCase().includes('from') || priceStr.includes('من')
          ? `من ${formattedOmar} ريال عماني`
          : `${formattedOmar} ريال عماني`;
      } else {
        return priceStr.toLowerCase().includes('from')
          ? `From OMR ${formattedOmar}`
          : `OMR ${formattedOmar}`;
      }
    };

    if (updated.serviceFee) {
      updated.serviceFee = convertPrice(updated.serviceFee);
    }
    if (updated.governmentFees) {
      updated.governmentFees = convertPrice(updated.governmentFees);
    }
    
    return updated;
  });
}

// ─── CONTENT OBJECT ──────────────────────────────────────────────────────────
export const content: Record<Language, Record<Country, Content>> = {
  en: {
    uae: {
      header: {
        title: 'ABU ARSAM',
        subtitle: 'Managed by Reza Amareh | Your Trusted Partner in UAE',
        tagline: 'Turn the Engine of Your Business On in Dubai',
      },
      services: {
        title: 'Our Services in UAE',
        items: servicesListEN.filter(s => uaeServiceIds.includes(s.id)),
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2026 ABU ARSAM. All rights reserved.',
      },
    },
    oman: {
      header: {
        title: 'ABU ARSAM',
        subtitle: 'Managed by Reza Amareh | Your Trusted Partner in Oman',
        tagline: 'Build Your Success in the Sultanate of Oman',
      },
      services: {
        title: 'Our Services in Oman',
        items: convertToOmanServices(servicesListEN, 'en'),
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2026 ABU ARSAM. All rights reserved.',
      },
    },
  },
  fa: {
    uae: {
      header: {
        title: 'ابوآرسام',
        subtitle: 'با مدیریت رضا اماره | همراه مطمئن شما در امارات',
        tagline: 'موتور کسب‌وکار خود را در دبی روشن کنید',
      },
      services: {
        title: 'خدمات ما در امارات',
        items: servicesListFA.filter(s => uaeServiceIds.includes(s.id)),
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۶ ابوآرسام. تمامی حقوق محفوظ است.',
      },
    },
    oman: {
      header: {
        title: 'ابوآرسام',
        subtitle: 'با مدیریت رضا اماره | همراه مطمئن شما در عمان',
        tagline: 'موفقیت خود را در سلطان‌نشین عمان بسازید',
      },
      services: {
        title: 'خدمات ما در عمان',
        items: convertToOmanServices(servicesListFA, 'fa'),
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۶ ابوآرسام. تمامی حقوق محفوظ است.',
      },
    },
  },
  ar: {
    uae: {
      header: {
        title: 'ابوآرسام',
        subtitle: 'بإدارة رضا أمارة | شريكك الموثوق في الإمارات',
        tagline: 'أطلق محرك أعمالك في دبي',
      },
      services: {
        title: 'خدماتنا في الإمارات',
        items: servicesListAR.filter(s => uaeServiceIds.includes(s.id)),
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2026 ابوآرسام. جميع الحقوق محفوظة.',
      },
    },
    oman: {
      header: {
        title: 'ابوآرسام',
        subtitle: 'بإدارة رضا أمارة | شريكك الموثوق في عمان',
        tagline: 'ابنِ نجاحك في سلطنة عمان',
      },
      services: {
        title: 'خدماتنا في عمان',
        items: convertToOmanServices(servicesListAR, 'ar'),
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2026 ابوآرسام. جميع الحقوق محفوظة.',
      },
    },
  },
};
