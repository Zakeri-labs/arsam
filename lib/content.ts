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

// 28 Services in English
const servicesListEN: Service[] = [
  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'Establishment Card Renewal',
    description: 'Ensure your business remains legally compliant and active by timely renewing your Establishment Card. Our team ensures quick processing and direct integration with immigration portals to prevent operations blockages or visa delays.',
    serviceFee: 'AED 150',
    governmentFees: 'AED 581',
    workingDays: '3 Working Days',
    requirements: ['Trade License Must be Valid', 'Last Card Must not be Blocked', 'Physical EID Required'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'Family Residency Renewal',
    description: 'Keep your family members legally resident in the country. We manage the entire documentation, application submission, medical screening bookings, and residency stampings smoothly to give you complete peace of mind.',
    serviceFee: 'AED 450',
    governmentFees: 'AED 1,340',
    workingDays: '5 Working Days',
    requirements: ['Sponsor Bank Statement', 'Sponsor EID Must be Valid', 'Sponsor Physical ID Required'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'Investor Residency Renewal',
    description: 'Renew your investor/partner visa to continue managing your business and enjoying full residency benefits. Our legal consultants fast-track your approval process through the immigration and economic departments.',
    serviceFee: 'AED 450',
    governmentFees: 'AED 1,380',
    workingDays: '5 Working Days',
    requirements: ['Business Bank Statement', 'Trade License Must be Valid', 'Valid Establishment Card'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'Trade License Renewal',
    description: 'Maintain your commercial operations without fines. We process your trade license renewal, register Ejari contracts, secure approvals from regulatory bodies, and facilitate flexible installment pay vouchers.',
    serviceFee: 'AED 300',
    governmentFees: 'Government Fees From: AED 4,270',
    workingDays: '3 Working Days',
    requirements: ['Ejari Must be Valid', 'Valid Establishment Card', 'Pay Voucher By Tabby'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'Ejari Registration - 1 Month Valid',
    description: 'Instant Ejari registration for 1 month validity, complete with an inspection option valid for up to 1 year. Essential for new company setups and prompt trade license renewals.',
    serviceFee: 'AED 1,950',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'Ejari Registration - 1 Month Valid (Without Inspection)',
    description: 'Fast track Ejari registration for 1 month validity without physical inspection, ideal for rapid business licensing and administrative updates.',
    serviceFee: 'AED 1,650',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Without Inspection'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'Ejari Registration - 1 Month Valid - Sep Office',
    description: 'Official 1-month valid Ejari registration for a separate office space, complete with inspection options to meet DED regulatory standards.',
    serviceFee: 'AED 2,050',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'Ejari Registration - 1 Month Valid - Shop',
    description: 'Retail shop Ejari registration with a 1-month validity. Processed without physical inspection for immediate compliance and commercial approvals.',
    serviceFee: 'AED 2,150',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Without Inspection'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'Ejari Registration - 1 Year Valid',
    description: 'Annual Ejari registration with a 1-year validity, including full inspection support. Highly recommended for standard long-term operations and standard commercial setups.',
    serviceFee: 'AED 3,150',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'Ejari Registration - 1 Year Valid - Sep Office',
    description: 'Premium annual Ejari registration for separate office units, designed for medium to large corporate setups requiring inspections and municipal compliance.',
    serviceFee: 'AED 3,250',
    workingDays: '1 Working Day',
    requirements: ['Mandatory For New Companies', 'Mandatory For License Renew', 'Inspection Available For 1 Year'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-residential',
    title: 'Ejari Registration - Residential',
    description: 'Official residential Ejari registration, valid for 1 month without physical inspection. Perfect for 1 or 2 bedroom apartments to quickly activate utilities or residency sponsorship.',
    serviceFee: 'AED 2,150',
    workingDays: '1 Working Day',
    requirements: ['One Month Valid', 'Without Inspection', 'One or two Bedrooms'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
  {
    id: 'business-account-high-risk',
    title: 'Business Account Opening - High Risk Activities',
    description: 'Professional corporate bank account opening for high-risk business sectors. We manage full compliance, background checks, document structuring, and local bank coordination.',
    serviceFee: 'AED 3,950',
    workingDays: '20 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'Business Account Opening - Low Risk Activities',
    description: 'Fast track corporate banking setup for low-risk business sectors. Swift approvals from top-tier local and international banks with dedicated support.',
    serviceFee: 'AED 2,950',
    workingDays: '5 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Visa Must Be Valid', 'Required For Residency Renew'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'Corporate Tax Registration',
    description: 'Official corporate tax registration with the Federal Tax Authority (FTA). Avoid the AED 10,000 fine by registering within the required 87-day limit.',
    serviceFee: 'AED 180',
    workingDays: '3 Working Days',
    requirements: ['Within 87 Days', 'Mandatory For all Companies', 'AED 10\'000 Fine'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'Corporate Tax Return Filing',
    description: 'Accurate corporate tax return preparation and submission within the 9-month legal deadline. Prevents hefty monthly penalties and ensures full compliance.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Within 9 Months', 'Mandatory For all Companies', 'AED 500 to 1000 Fine Monthly'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'FTA Profile Update',
    description: 'Official update of your Federal Tax Authority profile following updates in trade license, managing partners, or company office location to prevent portal freezes.',
    serviceFee: 'AED 280',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Updated', 'Manager Visa Must Be Updated', 'Company Location Must Be Updated'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'Request For Reconsideration',
    description: 'Submit professional appeals and waiver requests for tax penalties under FTA laws. We draft robust legal arguments to maximize penalty waiver success.',
    serviceFee: 'AED 380',
    workingDays: '2 Working Days',
    requirements: ['Penalty Reconsideration', 'Waiving is Not Guaranteed', 'According to FTA Laws'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: '30 Days Tourist Visa',
    description: 'Secure a fast-processed 30-day tourist visa for leisure or business travel. Direct application processing with minimum documents and high approval rate.',
    serviceFee: 'AED 290',
    workingDays: '3 Working Days',
    requirements: ['No. of Entries: Single Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: '60 Days Tourist Visa',
    description: 'Enjoy a longer stay with our 60-day single-entry tourist visa. Perfect for family visits, extended holidays, or exploring local business opportunities.',
    serviceFee: 'AED 490',
    workingDays: '3 Working Days',
    requirements: ['No. of Entries: Single Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'Multi 60 Days Visa',
    description: 'Multi-entry 60-day visa processed in just 1 working day. Best suited for frequent business travelers entering and leaving the country regularly.',
    serviceFee: 'AED 790',
    workingDays: '1 Working Day',
    requirements: ['No. of Entries: Multiple Entry'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'Tourist Visa Renewal',
    description: 'Extend your stay legally without leaving the country. We handle tourist visa renewals for up to 4 months in total to ensure no overstay fines.',
    serviceFee: 'AED 1,090',
    workingDays: '3 Working Days',
    requirements: ['Max Stay: Four Month in Total'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'Change Activity(ies)',
    description: 'Add, remove, or modify your trade license activities. We handle local department approvals, municipal requirements, and Memorandum of Association (MOA) amendments.',
    serviceFee: 'AED 450',
    governmentFees: 'Govt. Fees From: AED 3,000',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Must Sign MOA', 'Change Name Required'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'Change Business Name',
    description: 'Officially change your corporate or brand name. We cover brand name reservation, MOA amendment, municipal updates, and publication of the new trade license.',
    serviceFee: 'AED 450',
    governmentFees: 'Government Fees From: AED 800',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Most Sign MOA', 'Name Reservation Required'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'Change Location',
    description: 'Relocate your business address legally. We update your physical office location on the trade license and process municipal address modifications swiftly.',
    serviceFee: 'AED 300',
    governmentFees: 'Government Fees From: AED 800',
    workingDays: '2 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Most Sign MOA', 'New Ejari Required'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'License Modification',
    description: 'Comprehensive structural modifications to your license, such as altering partners, modifying share capital, updating management structure, or changing local sponsors.',
    serviceFee: 'Service Fee From: AED 450',
    governmentFees: 'Govt. Fees From: AED 3,000',
    workingDays: '3 Working Days',
    requirements: ['License Must Be Valid', 'All Partners Must Sign MOA', 'DED Approval Required'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'Family Residency Cancellation',
    description: 'Officially cancel family residency permits when relocating or changing sponsors. We ensure error-free paperwork to maintain clean immigration profiles.',
    serviceFee: 'AED 300',
    governmentFees: 'Government Fees: AED 290',
    workingDays: '3 Working Days',
    requirements: ['Sponsor Physical EID', 'Entry Permit Application', 'Refund Available'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'Investor Residency Cancellation',
    description: 'Proper cancellation of investor/partner residency visas. Highly critical for corporate restructuring, shifting ownership, or cancellation of company license.',
    serviceFee: 'AED 300',
    governmentFees: 'Government Fees: AED 330',
    workingDays: '5 Working Days',
    requirements: ['NOC Letter Required', 'Valid Establishment Card', 'Physical Emirates ID'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'Trade License Cancellation',
    description: 'Legal company liquidation and license cancellation. We handle auditing reports, official announcements, local department approvals, and final cancellation certificates.',
    serviceFee: 'AED 300',
    governmentFees: 'Govt. Fees From: AED 6,000',
    workingDays: '5 Working Days',
    requirements: ['Partners Visa Cancellation', 'All Partners Must Sign', 'Company Audition Required'],
    category: 'Cancellation Services'
  }
];

// 28 Services in Persian
const servicesListFA: Service[] = [
  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'تمدید استبلیشمنت کارت (کارت تاسیس)',
    description: 'حفظ وضعیت قانونی و فعال ماندن کارت تاسیس شرکت جهت ثبت درخواست‌های ویزا و امور اقامتی. تیم ما فرآیند تمدید را سریع و ایمن از طریق پرتال‌های رسمی انجام می‌دهد.',
    serviceFee: '۱۵۰ درهم',
    governmentFees: '۵۸۱ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['لایسنس تجاری باید معتبر باشد', 'کارت قبلی نباید مسدود باشد', 'نیاز به کارت ملی امارات (EID) فیزیکی'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'تمدید اقامت خانوادگی',
    description: 'اقامت قانونی و بدون دغدغه خانواده خود را حفظ کنید. ما کلیه فرآیندهای مدارک، تست‌های پزشکی و تایید نهایی ویزا را به صورت کامل و سریع پیگیری می‌کنیم.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: '۱,۳۴۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['پرینت حساب بانکی اسپانسر', 'کارت ملی امارات (EID) اسپانسر باید معتبر باشد', 'نیاز به کارت فیزیکی اسپانسر'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'تمدید اقامت سرمایه‌گذار',
    description: 'تمدید ویزای سرمایه‌گذاری یا شریک برای ادامه مدیریت بیزینس و برخورداری از مزایای کامل اقامت در کشور. تسریع فرآیند تایید در اداره مهاجرت.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: '۱,۳۸۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['پرینت حساب بانکی شرکت', 'لایسنس تجاری باید معتبر باشد', 'استبلیشمنت کارت معتبر شرکت'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'تمدید لایسنس تجاری',
    description: 'فعالیت‌های تجاری خود را بدون نگرانی از جریمه‌های شهرداری حفظ کنید. انجام تمدید لایسنس، ثبت عقد ایجاری و صدور فیش‌های پرداختی دولتی.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۴,۲۷۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['عقد ایجاری (Ejari) معتبر', 'استبلیشمنت کارت معتبر شرکت', 'قابلیت پرداخت فیش با تبی (Tabby)'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'ثبت ایجاری - اعتبار ۱ ماهه با بازرسی',
    description: 'ثبت فوری قرارداد رسمی ایجاری با اعتبار ۱ ماهه و امکان بازرسی تا سقف ۱ سال. الزامی برای ثبت و راه‌اندازی شرکت‌های جدید و تمدید لایسنس.',
    serviceFee: '۱,۹۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'ثبت ایجاری - اعتبار ۱ ماهه بدون بازرسی',
    description: 'ثبت سریع و فوری قرارداد ایجاری با اعتبار ۱ ماهه و بدون نیاز به بازرسی فیزیکی محل کار، ایده‌آل برای صدور فوری لایسنس و تسریع امور اداری.',
    serviceFee: '۱,۶۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'بدون نیاز به بازرسی فیزیکی'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'ثبت ایجاری دفتر کار مجزا - اعتبار ۱ ماهه',
    description: 'ثبت رسمی قرارداد ایجاری ۱ ماهه برای واحدهای اداری و دفاتر کار مستقل با امکان بازرسی ۱ ساله جهت انطباق با قوانین شهرداری و DED.',
    serviceFee: '۲,۰۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'ثبت ایجاری مغازه - اعتبار ۱ ماهه',
    description: 'ثبت قرارداد ایجاری برای واحدهای تجاری و مغازه‌ها با اعتبار ۱ ماهه و بدون نیاز به بازرسی فیزیکی جهت اخذ فوری موافقت‌های لایسنس تجاری.',
    serviceFee: '۲,۱۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'بدون نیاز به بازرسی فیزیکی'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'ثبت ایجاری - اعتبار ۱ ساله با بازرسی',
    description: 'ثبت رسمی قرارداد ایجاری یک‌ساله به همراه هماهنگی کامل خدمات بازرسی فیزیکی. گزینه‌ای مطمئن و پایدار برای بیزینس‌های طولانی‌مدت.',
    serviceFee: '۳,۱۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'ثبت ایجاری دفتر مجزا - اعتبار ۱ ساله',
    description: 'ثبت قرارداد رسمی ایجاری سالانه برای واحدهای اداری و دفاتر مستقل به همراه پشتیبانی بازرسی فیزیکی. مناسب برای شرکت‌های متوسط و بزرگ.',
    serviceFee: '۳,۲۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['الزامی برای تاسیس شرکت‌های جدید', 'الزامی برای تمدید لایسنس', 'قابلیت بازرسی هماهنگ شده تا ۱ سال'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-residential',
    title: 'ثبت ایجاری مسکونی',
    description: 'ثبت قرارداد رسمی ایجاری برای واحدهای مسکونی (یک یا دو خوابه) با اعتبار ۱ ماهه و بدون نیاز به بازرسی جهت ثبت فوری اقامت خانواده.',
    serviceFee: '۲,۱۵۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['ثبت با اعتبار یک ماهه', 'بدون نیاز به بازرسی فیزیکی', 'مناسب برای آپارتمان‌های یک یا دو خوابه'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
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
    description: 'راه‌اندازی سریع حساب بانکی شرکتی برای بیزینس‌های کم‌ریسک. اخذ تاییدیه از معتبرترین بانک‌های امارات با کمترین دغدغه اداری.',
    serviceFee: '۲,۹۵۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'ویزای کلیه شرکا باید معتبر باشد', 'الزامی جهت فرآیند تمدید اقامت'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'ثبت‌نام مالیات شرکت‌ها (Corporate Tax)',
    description: 'ثبت‌نام رسمی شرکت در سیستم مالیاتی سازمان مالیات فدرال (FTA). جلوگیری از جریمه سنگین ۱۰,۰۰۰ درهمی با ثبت‌نام در بازه قانونی ۸۷ روزه.',
    serviceFee: '۱۸۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['ثبت‌نام حداکثر طی ۸۷ روز از ثبت شرکت', 'الزامی برای کلیه شرکت‌های فعال و غیرفعال', 'جریمه ۱۰,۰۰۰ درهمی در صورت تاخیر'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'ارسال اظهارنامه مالیاتی شرکت',
    description: 'تنظیم و ارسال اظهارنامه مالیاتی شرکت طبق استانداردهای حسابداری امارات در مهلت قانونی ۹ ماهه جهت جلوگیری از جریمه‌های ماهانه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['ارسال در بازه حداکثر ۹ ماهه', 'الزامی برای کلیه شرکت‌های ثبت شده', 'جریمه ۵۰۰ الی ۱۰۰۰ درهمی ماهانه در صورت عدم ارسال'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'به‌روزرسانی پروفایل مالیاتی (FTA)',
    description: 'اصلاح و به‌روزرسانی مشخصات و مدارک شرکت در پرتال سازمان مالیات فدرال (FTA) پس از اعمال تغییرات لایسنس، آدرس یا مدیریت.',
    serviceFee: '۲۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اطلاعات لایسنس باید به‌روز باشد', 'ویزای مدیر مسئول باید به‌روز باشد', 'محل دقیق شرکت باید ثبت و به‌روز باشد'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'درخواست بازنگری جرایم مالیاتی',
    description: 'ثبت رسمی درخواست تجدیدنظر و بخشش جرایم مالیاتی طبق قوانین FTA. تنظیم لوایح دفاعی قانونی جهت افزایش شانس معافیت از جریمه.',
    serviceFee: '۳۸۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['اعتراض به جرایم صادره مالیاتی', 'عدم تضمین ۱۰۰٪ بخشش (بستگی به قوانین دارد)', 'تنظیم لایحه بر اساس قوانین رسمی FTA'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: 'ویزای توریستی ۳۰ روزه',
    description: 'اخذ سریع ویزای گردشگری ۳۰ روزه یک‌بار ورود برای سفرهای توریستی یا تجاری. تایید سریع با حداقل مدارک هویتی.',
    serviceFee: '۲۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['نوع ویزا: یک‌بار ورود (Single Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'ویزای توریستی ۶۰ روزه',
    description: 'اقامت طولانی‌تر در کشور با ویزای ۶۰ روزه یک‌بار ورود. مناسب برای دیدارهای خانوادگی، تعطیلات طولانی یا کار‌های اداری اولیه.',
    serviceFee: '۴۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['نوع ویزا: یک‌بار ورود (Single Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'ویزای ۶۰ روزه چند بار ورود (مولتی)',
    description: 'صدور ویزای ۶۰ روزه با قابلیت چندین بار خروج و ورود در سریع‌ترین زمان ممکن (۱ روز کاری). بهترین گزینه برای سفر‌های متعدد کاری.',
    serviceFee: '۷۹۰ درهم',
    workingDays: '۱ روز کاری',
    requirements: ['نوع ویزا: چند بار ورود (Multiple Entry)'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تمدید ویزای توریستی',
    description: 'تمدید کاملاً قانونی اقامت ویزای توریستی بدون نیاز به خروج از کشور. امکان تمدید تا سقف حداکثر ۴ ماه مجموع اقامت.',
    serviceFee: '۱,۰۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['حداکثر مدت اقامت: ۴ ماه در مجموع'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'تغییر فعالیت‌های لایسنس (Activity)',
    description: 'اضافه، حذف یا اصلاح فعالیت‌های تجاری ثبت شده لایسنس. انجام تاییدیه‌های شهرداری، اصلاح اساسنامه (MOA) و هماهنگی شرکا.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۳,۰۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به ثبت تغییر نام در صورت لزوم'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'تغییر نام تجاری شرکت',
    description: 'تغییر نام رسمی شرکت یا برند تجاری شما. شامل رزرواسیون نام جدید در دپارتمان اقتصادی، اصلاح اساسنامه و صدور لایسنس جدید.',
    serviceFee: '۴۵۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۸۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به رزرو رسمی نام جدید شرکت'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'تغییر آدرس قانونی شرکت',
    description: 'تغییر رسمی و قانونی آدرس ثبت شده شرکت. به‌روزرسانی محل فعالیت جدید در لایسنس تجاری و ثبت آدرس جدید در سامانه‌های شهری.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۸۰۰ درهم',
    workingDays: '۲ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به عقد ایجاری (Ejari) جدید برای آدرس جدید'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'اصلاح و تغییرات لایسنس',
    description: 'تغییرات اساسی ساختاری در لایسنس شرکت، شامل ورود یا خروج شرکا، کاهش یا افزایش سرمایه، تغییرات مدیریتی و تایید سازمان اقتصادی.',
    serviceFee: 'هزینه خدمات از: ۴۵۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۳,۰۰۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['لایسنس شرکت باید معتبر باشد', 'امضای کلیه شرکا روی برگه اصلاحیه اساسنامه', 'نیاز به تایید رسمی دپارتمان اقتصادی (DED)'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'کنسلی اقامت خانواده',
    description: 'لغو رسمی اقامت و ویزای اعضای خانواده جهت تغییر اسپانسر یا خروج از کشور. انجام سریع فرآیند اداری بدون دردسر.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'هزینه‌های دولتی: ۲۹۰ درهم',
    workingDays: '۳ روز کاری',
    requirements: ['کارت ملی امارات فیزیکی اسپانسر', 'فرم درخواست لغو مجوز ورود', 'امکان عودت وجه تضمین در صورت وجود'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'کنسلی اقامت سرمایه‌گذار',
    description: 'ابطال و کنسلی اصولی ویزای اقامت سرمایه‌گذاری یا شریک شرکت. فرآیندی بسیار حساس جهت فروش سهم یا خروج رسمی از ساختار شرکت.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'هزینه‌های دولتی: ۳۳۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['نامه عدم اعتراض (NOC) رسمی', 'استبلیشمنت کارت معتبر شرکت', 'کارت فیزیکی ملی امارات (Emirates ID)'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'انحلال و کنسلی لایسنس تجاری',
    description: 'تصفیه قانونی و ابطال رسمی لایسنس تجاری شرکت. شامل خدمات حسابرسی تسویه، ثبت آگهی رسمی انحلال و اخذ گواهی نهایی ابطال.',
    serviceFee: '۳۰۰ درهم',
    governmentFees: 'هزینه‌های دولتی از: ۶,۰۰۰ درهم',
    workingDays: '۵ روز کاری',
    requirements: ['ابطال قبلی ویزای اقامت کلیه شرکا', 'امضا و تایید رسمی انحلال توسط تمام شرکا', 'ارائه گزارش رسمی حسابرسی تصفیه شرکت'],
    category: 'Cancellation Services'
  }
];

// 28 Services in Arabic
const servicesListAR: Service[] = [
  // Renewal Services
  {
    id: 'establishment-card-renewal',
    title: 'تجديد بطاقة المنشأة',
    description: 'تجديد بطاقة المنشأة لشركتكم لضمان استمرارية العمليات القانونية وسهولة تقديم طلبات الإقامة والتوظيف دون تأخير أو غرامات.',
    serviceFee: '150 درهم',
    governmentFees: '581 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن تكون الرخصة التجارية سارية', 'يجب ألا تكون البطاقة السابقة محظورة', 'الهوية الإماراتية الأصلية مطلوبة'],
    category: 'Renewal Services'
  },
  {
    id: 'family-residency-renewal',
    title: 'تجديد الإقامة العائلية',
    description: 'حافظ على الوضع القانوني لإقامة أفراد عائلتك المكفولين داخل الدولة. ننجز كافة الإجراءات والخطوات والفحوصات الطبية بالنيابة عنك.',
    serviceFee: '450 درهم',
    governmentFees: '1,340 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['كشف حساب بنكي للكفيل', 'يجب أن تكون هوية الكفيل سارية', 'الهوية الإماراتية الأصلية للكفيل مطلوبة'],
    category: 'Renewal Services'
  },
  {
    id: 'investor-residency-renewal',
    title: 'تجديد إقامة مستثمر',
    description: 'تجديد تأشيرة المستثمر أو الشريك لمواصلة إدارة أعمالكم والاستمتاع بمزايا الإقامة الكاملة بأعلى درجات السرعة والمهنية.',
    serviceFee: '450 درهم',
    governmentFees: '1,380 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['كشف حساب بنكي للشركة', 'يجب أن تكون الرخصة التجارية سارية', 'بطاقة منشأة سارية المفعول'],
    category: 'Renewal Services'
  },
  {
    id: 'trade-license-renewal',
    title: 'تجديد الرخصة التجارية',
    description: 'تجديد رخصتكم التجارية لتفادي الغرامات وضمان استمرارية نشاطكم التجاري بشكل متوافق تماماً، مع تسهيل خيارات الدفع والتقسيط.',
    serviceFee: '300 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 4,270 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن يكون عقد إيجاري سارياً', 'بطاقة منشأة سارية المفعول', 'دفع الرسوم عبر منصة تابي (Tabby)'],
    category: 'Renewal Services'
  },

  // Ejari Registration Services
  {
    id: 'ejari-1-month-inspection',
    title: 'تسجيل إيجاري - صلاحية شهر واحد',
    description: 'تسجيل إيجاري فوري بصلاحية شهر واحد مع خيار التفتيش المتاح لمدة عام كامل. أساسي للشركات الجديدة وتجديد الرخص.',
    serviceFee: '1,950 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-no-inspection',
    title: 'تسجيل إيجاري - صلاحية شهر (بدون تفتيش)',
    description: 'تسجيل إيجاري سريع وصلاحية شهر واحد بدون تفتيش فزيائي، مثالي لإنجاز الرخص التجارية والمعاملات الإدارية بسرعة وسهولة.',
    serviceFee: '1,650 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'إجراء بدون تفتيش ميداني'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-sep-office',
    title: 'تسجيل إيجاري مكتب مستقل - شهر واحد',
    description: 'تسجيل عقد إيجاري رسمي لمكتب مستقل بصلاحية شهر واحد مع خيار التفتيش للوفاء بالاشتراطات التنظيمية والبلدية ودائرة التنمية الاقتصادية.',
    serviceFee: '2,050 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-month-shop',
    title: 'تسجيل إيجاري محل تجاري - شهر واحد',
    description: 'تسجيل إيجاري للمحلات التجارية بصلاحية شهر واحد وبدون تفتيش للحصول الفوري على الموافقات المطلوبة من الجهات الرسمية.',
    serviceFee: '2,150 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'إجراء بدون تفتيش ميداني'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year',
    title: 'تسجيل إيجاري - صلاحية سنة كاملة',
    description: 'تسجيل عقد إيجاري رسمي لمدة سنة كاملة شاملة خدمات التفتيش. خيار مستقر وموصى به للأعمال والشركات المستدامة.',
    serviceFee: '3,150 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-1-year-sep-office',
    title: 'تسجيل إيجاري مكتب مستقل - سنة كاملة',
    description: 'تسجيل إيجاري سنوي متميز للمكاتب المستقلة، مصمم للشركات والمؤسسات التي تتطلب تفتيشاً وموافقات بلدية متكاملة.',
    serviceFee: '3,250 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['إلزامي للشركات الجديدة', 'إلزامي لتجديد الرخصة التجارية', 'التفتيش متاح لمدة عام كامل'],
    category: 'Ejari Registration Services'
  },
  {
    id: 'ejari-residential',
    title: 'تسجيل إيجاري سكني',
    description: 'تسجيل رسمي لعقد الإيجاري السكني للشقق المكونة من غرفة أو غرفتين بصلاحية شهر وبدون تفتيش، لسرعة كفالة الأسرة وتفعيل الخدمات.',
    serviceFee: '2,150 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['صلاحية لمدة شهر واحد', 'إجراء بدون تفتيش ميداني', 'مخصص للشقق السكنية غرفة أو غرفتين'],
    category: 'Ejari Registration Services'
  },

  // Banking Services
  {
    id: 'business-account-high-risk',
    title: 'فتح حساب بنكي للشركات - الأنشطة عالية المخاطر',
    description: 'تسهيل فتح حسابات بنكية للأنشطة التجارية ذات التصنيف عالي المخاطر مع إعداد ملف الامتثال والوثائق والتنسيق مع أفضل المصارف المحلية.',
    serviceFee: '3,950 درهم',
    workingDays: '20 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'يجب أن تكون إقامات الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },
  {
    id: 'business-account-low-risk',
    title: 'فتح حساب بنكي للشركات - الأنشطة منخفضة المخاطر',
    description: 'فتح حساب بنكي تجاري سريع وسلس للقطاعات منخفضة المخاطر بالتعاون مع أفضل البنوك المحلية والدولية في دولة الإمارات.',
    serviceFee: '2,950 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'يجب أن تكون إقامات الشركاء سارية', 'مطلوب لتجديد الإقامة'],
    category: 'Banking Services'
  },

  // Tax Services
  {
    id: 'corporate-tax-registration',
    title: 'التسجيل في ضريبة الشركات',
    description: 'التسجيل الرسمي في ضريبة الشركات لدى الهيئة الاتحادية للضرائب لتفادي الغرامات الضخمة البالغة 10,000 درهم بالتسجيل خلال الفترة المحددة.',
    serviceFee: '180 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['خلال فترة 87 يوماً كحد أقصى', 'إلزامي لجميع الشركات والمؤسسات', 'غرامة عدم التسجيل 10,000 درهم'],
    category: 'Tax Services'
  },
  {
    id: 'corporate-tax-filing',
    title: 'تقديم الإقرارات الضريبية للشركات',
    description: 'إعداد وتقديم الإقرارات الضريبية لشركتكم بدقة متناهية وفي المواعيد الرسمية لتجنب الغرامات الشهرية والامتثال التام لقوانين الدولة.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['خلال 9 أشهر كحد أقصى', 'إلزامي لجميع الشركات المسجلة', 'غرامة شهرية من 500 إلى 1000 درهم عند التأخير'],
    category: 'Tax Services'
  },
  {
    id: 'fta-profile-update',
    title: 'تحديث ملف الهيئة الاتحادية للضرائب',
    description: 'تعديل وتحديث بيانات شركتكم الرسمية على بوابة الهيئة الاتحادية للضرائب بعد تعديل الرخصة أو الإدارة أو المقر لتجنب تعليق الملف.',
    serviceFee: '280 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب تحديث بيانات الرخصة أولاً', 'يجب تحديث تأشيرة المدير المسؤول', 'يجب تحديث موقع وعنوان مقر الشركة'],
    category: 'Tax Services'
  },
  {
    id: 'tax-reconsideration',
    title: 'طلب إعادة النظر في الغرامات',
    description: 'تقديم طلب إعادة نظر رسمي في الغرامات الضريبية المفروضة من الهيئة، وصياغة الدفوع القانونية المناسبة لزيادة فرص الإعفاء أو التخفيض.',
    serviceFee: '380 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['تقديم طلب تظلم من الغرامات', 'الموافقة على الإعفاء غير مضمونة (حسب الحالة)', 'الصياغة وفق قوانين الهيئة الاتحادية للضرائب'],
    category: 'Tax Services'
  },

  // Tourism Services
  {
    id: 'tourist-visa-30-days',
    title: 'تأشيرة سياحية لمدة 30 يوماً',
    description: 'إصدار تأشيرة سياحية سريعة وصالحة لمدة 30 يوماً لدخول واحد، مثالية للزيارات السياحية القصيرة أو استكشاف الفرص التجارية.',
    serviceFee: '290 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['عدد مرات الدخول: دخول واحد فقط'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-60-days',
    title: 'تأشيرة سياحية لمدة 60 يوماً',
    description: 'تمتع بإقامة أطول مع تأشيرة دخول واحد لمدة 60 يوماً، ممتازة للزيارات العائلية الطويلة أو دراسة الفرص الاستثمارية براحة تامة.',
    serviceFee: '490 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['عدد مرات الدخول: دخول واحد فقط'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-multi-60-days',
    title: 'تأشيرة متعددة الدخول لمدة 60 يوماً',
    description: 'إصدار تأشيرة متعددة الدخول لمدة 60 يوماً خلال يوم عمل واحد فقط، مناسبة جداً لرجال الأعمال والمسافرين بشكل متكرر.',
    serviceFee: '790 درهم',
    workingDays: 'يوم عمل واحد',
    requirements: ['عدد مرات الدخول: دخول متعدد'],
    category: 'Tourism Services'
  },
  {
    id: 'tourist-visa-renewal',
    title: 'تجديد التأشيرة السياحية',
    description: 'تجديد إقامتك السياحية بشكل قانوني داخل الدولة وبدون الحاجة للمغادرة، لتجنب غرامات مخالفة شروط الإقامة.',
    serviceFee: '1,090 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['أقصى مدة إقامة: 4 أشهر في المجمل'],
    category: 'Tourism Services'
  },

  // License Modification Services
  {
    id: 'change-activity',
    title: 'تعديل الأنشطة التجارية',
    description: 'إضافة أو تعديل الأنشطة في رخصتكم التجارية بما يتناسب مع تطور أعمالكم، وإنجاز الموافقات وتعديل عقد التأسيس (MOA) رسمياً.',
    serviceFee: '450 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 3,000 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'مطلوب تعديل الاسم عند الاقتضاء'],
    category: 'License Modification Services'
  },
  {
    id: 'change-business-name',
    title: 'تغيير الاسم التجاري',
    description: 'تغيير الاسم الرسمي للشركة أو العلامة التجارية، بما يشمل حجز الاسم الجديد وتعديل عقد التأسيس وإصدار الرخصة المحدثة والموافقات البلدية.',
    serviceFee: '450 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 800 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'حجز الاسم التجاري الجديد مطلوب أولاً'],
    category: 'License Modification Services'
  },
  {
    id: 'change-location',
    title: 'تغيير عنوان وموقع الشركة',
    description: 'تعديل العنوان الرسمي للشركة في الرخصة التجارية، وإنجاز المعاملات البلدية والإيجارية لإثبات المقر الجديد وتثبيته في السجلات.',
    serviceFee: '300 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 800 درهم',
    workingDays: '2 يوم عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'عقد إيجاري (Ejari) جديد وموثق مطلوب'],
    category: 'License Modification Services'
  },
  {
    id: 'license-modification',
    title: 'تعديل وتحديث الرخصة',
    description: 'إجراء تعديلات هيكلية شاملة على الرخصة، مثل إدخال أو إخراج الشركاء وتعديل رأس المال أو تحديث الهيكل الإداري أو الكفيل المحلي.',
    serviceFee: 'رسوم الخدمة تبدأ من: 450 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 3,000 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['يجب أن تكون الرخصة سارية', 'توقيع جميع الشركاء على ملحق عقد التأسيس', 'موافقة دائرة التنمية الاقتصادية (DED) مطلوبة'],
    category: 'License Modification Services'
  },

  // Cancellation Services
  {
    id: 'family-residency-cancellation',
    title: 'إلغاء الإقامة العائلية',
    description: 'إلغاء تصاريح الإقامة العائلية بشكل رسمي عند تغيير الكفيل أو مغادرة الدولة، مع ضمان إنجاز المعاملة في إدارة الهجرة بلا غرامات.',
    serviceFee: '300 درهم',
    governmentFees: 'الرسوم الحكومية: 290 درهم',
    workingDays: '3 أيام عمل',
    requirements: ['الهوية الإماراتية الأصلية للكفيل', 'طلب تصريح إلغاء إذن الدخول', 'استرداد مبلغ الضمان متاح عند الإلغاء'],
    category: 'Cancellation Services'
  },
  {
    id: 'investor-residency-cancellation',
    title: 'إلغاء إقامة مستثمر',
    description: 'إلغاء تصريح إقامة الشريك أو المستثمر بشكل قانوني سليم، وهو أمر أساسي لإعادة هيكلة الشركة أو نقل الملكية أو إغلاق الرخصة.',
    serviceFee: '300 درهم',
    governmentFees: 'الرسوم الحكومية: 330 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['رسالة عدم ممانعة (NOC) رسمية وموقعة', 'بطاقة منشأة سارية المفعول', 'الهوية الإماراتية الأصلية مطلوبة'],
    category: 'Cancellation Services'
  },
  {
    id: 'trade-license-cancellation',
    title: 'إلغاء وإغلاق الرخصة التجارية',
    description: 'تصفية الشركة وإلغاء رخصتها التجارية بشكل رسمي وقانوني متكامل، يشمل تقديم التقرير المالي النهائي ونشر إعلان التصفية وإصدار الشهادة.',
    serviceFee: '300 درهم',
    governmentFees: 'الرسوم الحكومية تبدأ من: 6,000 درهم',
    workingDays: '5 أيام عمل',
    requirements: ['إلغاء تأشيرات إقامة جميع الشركاء أولاً', 'توقيع جميع الشركاء على قرار التصفية', 'إعداد تقرير مالي نهائي معتمد لتصفية الشركة'],
    category: 'Cancellation Services'
  }
];

export const content: Record<Language, Record<Country, Content>> = {
  en: {
    uae: {
      header: {
        title: 'AL UFUQ AL DAHABI',
        subtitle: 'Your Trusted Partner for Starting, Managing, and Growing Your Business in UAE',
        tagline: 'Turn the Engine of Your Business On in Dubai',
      },
      services: {
        title: 'Our Services in UAE',
        items: servicesListEN,
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2024 AL UFUQ AL DAHABI. All rights reserved.',
      },
    },
    oman: {
      header: {
        title: 'AL UFUQ AL DAHABI',
        subtitle: 'Your Trusted Partner for Starting, Managing, and Growing Your Business in Oman',
        tagline: 'Build Your Success in the Sultanate of Oman',
      },
      services: {
        title: 'Our Services in Oman',
        items: servicesListEN, // Use the same structured service list for Oman as requested
      },
      cta: {
        title: 'Ready to Start Your Business Journey?',
        button: 'Contact Us Today',
      },
      footer: {
        copyright: '© 2024 AL UFUQ AL DAHABI. All rights reserved.',
      },
    },
  },
  fa: {
    uae: {
      header: {
        title: 'الافق الذهبی',
        subtitle: 'همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار در امارات',
        tagline: 'موتور کسب‌وکار خود را در دبی روشن کنید',
      },
      services: {
        title: 'خدمات ما در امارات',
        items: servicesListFA,
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۴ الافق الذهبی. تمامی حقوق محفوظ است.',
      },
    },
    oman: {
      header: {
        title: 'الافق الذهبی',
        subtitle: 'همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار در عمان',
        tagline: 'موفقیت خود را در سلطان‌نشین عمان بسازید',
      },
      services: {
        title: 'خدمات ما در عمان',
        items: servicesListFA, // Use the same structured service list for Oman as requested
      },
      cta: {
        title: 'آماده شروع سفر کسب‌وکار خود هستید؟',
        button: 'همین امروز تماس بگیرید',
      },
      footer: {
        copyright: '© ۲۰۲۴ الافق الذهبی. تمامی حقوق محفوظ است.',
      },
    },
  },
  ar: {
    uae: {
      header: {
        title: 'الأفق الذهبي',
        subtitle: 'شريكك الموثوق لبدء وإدارة وتنمية أعمالك في الإمارات',
        tagline: 'أطلق محرك أعمالك في دبي',
      },
      services: {
        title: 'خدماتنا في الإمارات',
        items: servicesListAR,
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2024 الأفق الذهبي. جميع الحقوق محفوظة.',
      },
    },
    oman: {
      header: {
        title: 'الأفق الذهبي',
        subtitle: 'شريكك الموثوق لبدء وإدارة وتنمية أعمالك في عمان',
        tagline: 'ابنِ نجاحك في سلطنة عمان',
      },
      services: {
        title: 'خدماتنا في عمان',
        items: servicesListAR, // Use the same structured service list for Oman as requested
      },
      cta: {
        title: 'هل أنت مستعد لبدء رحلة أعمالك؟',
        button: 'تواصل معنا اليوم',
      },
      footer: {
        copyright: '© 2024 الأفق الذهبي. جميع الحقوق محفوظة.',
      },
    },
  },
};
