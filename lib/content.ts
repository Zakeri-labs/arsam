export type Language = 'en' | 'fa' | 'ar';
export type Country = 'uae' | 'oman';

export interface Service {
  id: string;
  title: string;
  description: string;
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
        items: [
          { id: 'company-mainland', title: 'Company Registration (Mainland)', description: 'Complete company setup and residency in mainland UAE' },
          { id: 'company-freezone', title: 'Company Registration (Freezone)', description: 'Establish your business in UAE free zones with full ownership' },
          { id: 'license-renewal', title: 'License & Establishment Card Renewal', description: 'Timely renewal of your business licenses and establishment cards' },
          { id: 'residency-renewal', title: 'Residency Renewal', description: 'Hassle-free residency permit renewals for you and your family' },
          { id: 'family-visa', title: 'Family Visa Application', description: 'Sponsor your family members for UAE residence' },
          { id: 'trademark', title: 'Trademark Registration', description: 'Protect your brand with official trademark registration' },
          { id: 'ejari', title: 'Ejari (Rental Contract)', description: 'Official rental contract registration and management' },
          { id: 'driving-license', title: 'UAE Driving License Guidance', description: 'Step-by-step assistance for obtaining your UAE driving license' },
          { id: 'company-liquidation', title: 'Company Liquidation', description: 'Legal dissolution and liquidation services' },
          { id: 'personal-account', title: 'Personal Bank Account', description: 'Guidance for opening personal bank accounts' },
          { id: 'corporate-account', title: 'Corporate Bank Account', description: 'Assistance with corporate banking setup' },
          { id: 'vat-registration', title: 'VAT Registration', description: 'Value Added Tax registration and compliance' },
          { id: 'tax-filing', title: 'Tax Filing', description: 'Professional tax declaration and filing services' },
          { id: 'municipality-permits', title: 'Dubai Municipality Permits', description: 'Obtain commercial and service permits from Dubai Municipality' },
          { id: 'sports-council', title: 'Dubai Sports Council Permits', description: 'Licensing for sports and fitness related activities' },
          { id: 'rera', title: 'RERA (Real Estate Permits)', description: 'Real estate regulatory authority licensing' },
          { id: 'icv', title: 'ICV Certificate', description: 'In-Country Value certification services' },
          { id: 'tourist-visa', title: 'Tourist Visa Services', description: 'Tourist visa issuance and renewal' },
          { id: 'travel-services', title: 'Travel Services', description: 'Hotel bookings and flight tickets' },
        ],
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
        items: [
          { id: 'company-mainland', title: 'Company Registration (Mainland)', description: 'Complete company setup and residency in mainland Oman' },
          { id: 'company-freezone', title: 'Company Registration (Free Zones)', description: 'Establish your business in Oman free trade zones' },
          { id: 'license-renewal', title: 'Commercial Registry & Business Card Renewal', description: 'Renewal of commercial registry and business cards' },
          { id: 'residency-renewal', title: 'Residency Renewal', description: 'Hassle-free residency permit renewals' },
          { id: 'family-visa', title: 'Family Reunion Visa', description: 'Family reunification visa services (تأشيرة الالتحاق العائلي)' },
          { id: 'trademark', title: 'Trademark Registration', description: 'Brand and trademark protection services' },
          { id: 'rental-contract', title: 'Official Rental Contract (Municipality)', description: 'Official rental agreement registration with municipality' },
          { id: 'driving-license', title: 'Oman Driving License Guidance', description: 'Assistance for obtaining your Oman driving license' },
          { id: 'company-liquidation', title: 'Company Liquidation', description: 'Legal company dissolution services' },
          { id: 'personal-account', title: 'Personal Bank Account Opening', description: 'Personal banking setup services' },
          { id: 'corporate-account', title: 'Corporate Bank Account Opening', description: 'Corporate banking solutions' },
          { id: 'vat-registration', title: 'VAT Registration', description: 'Value Added Tax registration' },
          { id: 'tax-registration', title: 'Tax Registration', description: 'General tax registration services' },
          { id: 'tax-exemptions', title: 'Industrial Tax Exemptions', description: 'Obtain industrial tax exemption certificates' },
          { id: 'residency-cancellation', title: 'Residency Cancellation', description: 'Proper residency cancellation procedures' },
          { id: 'bayan', title: 'Customs Clearance (Bayan System)', description: 'Cargo clearance through Bayan system' },
          { id: 'tax-filing', title: 'Tax Filing', description: 'Tax declaration and filing services' },
          { id: 'commercial-permits', title: 'Commercial & Industrial Permits (EA)', description: 'Environmental and commercial licensing' },
          { id: 'madayn', title: 'Madayn Industrial Zone Permits', description: 'Industrial zone establishment permits' },
          { id: 'made-in-oman', title: 'Made in Oman Certificate', description: 'Certification for locally manufactured products' },
          { id: 'riyada', title: 'Riyada Card', description: 'SME support card and benefits' },
          { id: 'pacda', title: 'Civil Defense & Municipality Permits (PACDA)', description: 'Safety and municipal compliance permits' },
          { id: 'standards', title: 'Product Standards Certificate (G-mark/DGSMM)', description: 'Quality and standards certification' },
          { id: 'consulting', title: 'Business Setup Consulting', description: 'Commercial and industrial unit setup advisory' },
          { id: 'land-rental', title: 'Government Land Rental Guidance', description: 'Industrial zone land rental assistance' },
          { id: 'feasibility', title: 'Feasibility Study & Business Plan', description: 'Professional business planning services' },
          { id: 'accounting', title: 'Accounting & Auditing Services', description: 'Professional accounting and audit services' },
          { id: 'tourist-visa', title: 'Tourist Visa Services', description: 'Tourist visa issuance and renewal' },
          { id: 'travel-services', title: 'Travel Services', description: 'Hotel bookings and flight tickets' },
          { id: 'omanisation', title: 'Omanisation Management', description: 'Workforce nationalization compliance' },
        ],
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
        items: [
          { id: 'company-mainland', title: 'ثبت شرکت در سرزمین اصلی (Mainland)', description: 'ثبت شرکت و اخذ اقامت در سرزمین اصلی امارات' },
          { id: 'company-freezone', title: 'ثبت شرکت در منطقه آزاد (Freezone)', description: 'تأسیس کسب‌وکار در مناطق آزاد امارات با مالکیت کامل' },
          { id: 'license-renewal', title: 'تمدید لایسنس و استبلیشمنت کارت', description: 'تمدید به‌موقع مجوزهای تجاری و کارت‌های شناسایی شرکت' },
          { id: 'residency-renewal', title: 'تمدید اقامت', description: 'تمدید بدون دردسر اقامت برای شما و خانواده‌تان' },
          { id: 'family-visa', title: 'درخواست ویزای خانوادگی', description: 'کفالت اعضای خانواده برای اقامت در امارات' },
          { id: 'trademark', title: 'ثبت برند و علامت تجاری', description: 'محافظت از برند شما با ثبت رسمی علامت تجاری' },
          { id: 'ejari', title: 'تنظیم عقد ایجاری رسمی (Ejari)', description: 'ثبت و مدیریت رسمی قرارداد اجاره' },
          { id: 'driving-license', title: 'راهنمایی دریافت گواهینامه رانندگی امارات', description: 'کمک گام‌به‌گام برای اخذ گواهینامه رانندگی امارات' },
          { id: 'company-liquidation', title: 'انحلال و تصفیه قانونی شرکت', description: 'خدمات انحلال و تصفیه قانونی شرکت‌ها' },
          { id: 'personal-account', title: 'راهنمایی افتتاح حساب شخصی', description: 'راهنمایی برای افتتاح حساب بانکی شخصی' },
          { id: 'corporate-account', title: 'راهنمایی افتتاح حساب بانکی شرکتی', description: 'کمک در راه‌اندازی حساب بانکی شرکتی' },
          { id: 'vat-registration', title: 'ثبت‌نام مالیات بر ارزش افزوده (VAT)', description: 'ثبت‌نام و رعایت قوانین مالیات بر ارزش افزوده' },
          { id: 'tax-filing', title: 'ارسال اظهارنامه مالیاتی', description: 'خدمات حرفه‌ای اظهارنامه و تسلیم مالیاتی' },
          { id: 'municipality-permits', title: 'دریافت مجوزهای شهرداری دبی', description: 'اخذ مجوزهای تجاری و خدماتی از شهرداری دبی' },
          { id: 'sports-council', title: 'دریافت مجوزهای سازمان ورزش دبی', description: 'صدور مجوز برای فعالیت‌های ورزشی و تناسب اندام' },
          { id: 'rera', title: 'دریافت مجوزهای املاک و اراضی (RERA)', description: 'صدور مجوز از سازمان تنظیم مقررات املاک' },
          { id: 'icv', title: 'دریافت گواهی ارزش افزوده محلی (ICV)', description: 'خدمات صدور گواهی ارزش داخلی' },
          { id: 'tourist-visa', title: 'صدور و تمدید ویزا توریستی', description: 'صدور و تمدید ویزای گردشگری' },
          { id: 'travel-services', title: 'خدمات توریستی', description: 'رزرو هتل و بلیط هواپیما' },
        ],
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
        items: [
          { id: 'company-mainland', title: 'ثبت شرکت در سرزمین اصلی (Mainland)', description: 'ثبت شرکت و اخذ اقامت در سرزمین اصلی عمان' },
          { id: 'company-freezone', title: 'ثبت شرکت در مناطق آزاد تجاری', description: 'تأسیس کسب‌وکار در مناطق آزاد تجاری عمان' },
          { id: 'license-renewal', title: 'تمدید سجل تجاری و کارت بازرگانی', description: 'تمدید سجل تجاری و کارت‌های بازرگانی' },
          { id: 'residency-renewal', title: 'تمدید اقامت', description: 'تمدید بدون دردسر اقامت' },
          { id: 'family-visa', title: 'درخواست ویزای خانواده (تأشیرة الالتحاق العائلی)', description: 'خدمات ویزای پیوستگی خانواده' },
          { id: 'trademark', title: 'ثبت برند و علامت تجاری', description: 'خدمات حفاظت از برند و علامت تجاری' },
          { id: 'rental-contract', title: 'تنظیم عقد ایجاری رسمی (بلدیه)', description: 'ثبت رسمی قرارداد اجاره در شهرداری' },
          { id: 'driving-license', title: 'راهنمایی دریافت گواهینامه رانندگی عمان', description: 'کمک برای اخذ گواهینامه رانندگی عمان' },
          { id: 'company-liquidation', title: 'انحلال و تصفیه قانونی شرکت', description: 'خدمات انحلال قانونی شرکت' },
          { id: 'personal-account', title: 'افتتاح حساب بانکی شخصی', description: 'خدمات راه‌اندازی حساب بانکی شخصی' },
          { id: 'corporate-account', title: 'افتتاح حساب بانکی شرکتی', description: 'راه‌حل‌های بانکی شرکتی' },
          { id: 'vat-registration', title: 'ثبت‌نام مالیات بر ارزش افزوده (VAT)', description: 'ثبت‌نام مالیات بر ارزش افزوده' },
          { id: 'tax-registration', title: 'ثبت‌نام مالیاتی', description: 'خدمات ثبت‌نام مالیاتی عمومی' },
          { id: 'tax-exemptions', title: 'اخذ معافیت‌های مالیاتی صنعتی', description: 'اخذ گواهی معافیت مالیاتی صنعتی' },
          { id: 'residency-cancellation', title: 'کنسلی اقامت', description: 'انجام صحیح فرآیند کنسلی اقامت' },
          { id: 'bayan', title: 'ترخیص کالا از طریق سامانه بیان (Bayan)', description: 'ترخیص کالا از طریق سامانه بیان' },
          { id: 'tax-filing', title: 'ارسال اظهارنامه مالیاتی', description: 'خدمات اظهارنامه و تسلیم مالیاتی' },
          { id: 'commercial-permits', title: 'اخذ مجوزهای تجاری، صنعتی و زیست‌محیطی (EA)', description: 'صدور مجوزهای زیست‌محیطی و تجاری' },
          { id: 'madayn', title: 'اخذ مجوز در مناطق صنعتی مدائن (Madayn)', description: 'مجوزهای تأسیس در مناطق صنعتی' },
          { id: 'made-in-oman', title: 'اخذ گواهی Made in Oman', description: 'صدور گواهی برای محصولات تولید داخل' },
          { id: 'riyada', title: 'دریافت کارت ریاده (Riyada Card)', description: 'کارت حمایتی و مزایای SME' },
          { id: 'pacda', title: 'اخذ مجوزهای ایمنی دفاع مدنی (PACDA) و شهرداری', description: 'مجوزهای ایمنی و انطباق شهرداری' },
          { id: 'standards', title: 'اخذ گواهی استاندارد کالا (G-mark/DGSMM)', description: 'صدور گواهی کیفیت و استاندارد' },
          { id: 'consulting', title: 'مشاوره تجهیز واحدهای تجاری و صنعتی', description: 'مشاوره راه‌اندازی واحدهای تجاری و صنعتی' },
          { id: 'land-rental', title: 'راهنمایی اجاره زمین دولتی در شهرک‌های صنعتی', description: 'کمک در اجاره زمین مناطق صنعتی' },
          { id: 'feasibility', title: 'تهیه طرح توجیهی (Feasibility Study) و بیزینس پلن', description: 'خدمات حرفه‌ای برنامه‌ریزی کسب‌وکار' },
          { id: 'accounting', title: 'خدمات حسابداری و حسابرسی (Auditing & Accounting)', description: 'خدمات حرفه‌ای حسابداری و حسابرسی' },
          { id: 'tourist-visa', title: 'صدور و تمدید ویزا توریستی', description: 'صدور و تمدید ویزای گردشگری' },
          { id: 'travel-services', title: 'خدمات توریستی شامل هتل و بلیط هواپیما', description: 'رزرو هتل و بلیط هواپیما' },
          { id: 'omanisation', title: 'مدیریت عمان‌سازی (Omanisation)', description: 'انطباق با قوانین ملی‌سازی نیروی کار' },
        ],
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
        items: [
          { id: 'company-mainland', title: 'تسجيل الشركات (البر الرئيسي)', description: 'تأسيس شركة كاملة والحصول على إقامة في البر الرئيسي للإمارات' },
          { id: 'company-freezone', title: 'تسجيل الشركات (المنطقة الحرة)', description: 'أسس عملك في المناطق الحرة بالإمارات مع ملكية كاملة' },
          { id: 'license-renewal', title: 'تجديد الرخصة وبطاقة المنشأة', description: 'تجديد في الوقت المناسب لرخص أعمالك وبطاقات المنشأة' },
          { id: 'residency-renewal', title: 'تجديد الإقامة', description: 'تجديد تصاريح الإقامة بدون متاعب لك ولعائلتك' },
          { id: 'family-visa', title: 'طلب تأشيرة عائلية', description: 'كفالة أفراد عائلتك للإقامة في الإمارات' },
          { id: 'trademark', title: 'تسجيل العلامة التجارية', description: 'احمِ علامتك التجارية بالتسجيل الرسمي' },
          { id: 'ejari', title: 'إيجاري (عقد الإيجار)', description: 'تسجيل وإدارة عقود الإيجار الرسمية' },
          { id: 'driving-license', title: 'إرشادات رخصة القيادة الإماراتية', description: 'مساعدة خطوة بخطوة للحصول على رخصة قيادة إماراتية' },
          { id: 'company-liquidation', title: 'تصفية الشركات', description: 'خدمات الحل والتصفية القانونية' },
          { id: 'personal-account', title: 'الحساب البنكي الشخصي', description: 'إرشادات لفتح حسابات بنكية شخصية' },
          { id: 'corporate-account', title: 'الحساب البنكي للشركات', description: 'المساعدة في إعداد الخدمات المصرفية للشركات' },
          { id: 'vat-registration', title: 'التسجيل في ضريبة القيمة المضافة', description: 'التسجيل والامتثال لضريبة القيمة المضافة' },
          { id: 'tax-filing', title: 'تقديم الإقرارات الضريبية', description: 'خدمات الإقرار الضريبي وتقديمه بشكل احترافي' },
          { id: 'municipality-permits', title: 'تصاريح بلدية دبي', description: 'الحصول على التصاريح التجارية والخدمية من بلدية دبي' },
          { id: 'sports-council', title: 'تصاريح مجلس دبي الرياضي', description: 'ترخيص الأنشطة الرياضية واللياقة البدنية' },
          { id: 'rera', title: 'تصاريح ريرا (العقارات)', description: 'ترخيص هيئة التنظيم العقاري' },
          { id: 'icv', title: 'شهادة القيمة المحلية المضافة (ICV)', description: 'خدمات شهادة القيمة المحلية' },
          { id: 'tourist-visa', title: 'خدمات التأشيرة السياحية', description: 'إصدار وتجديد التأشيرات السياحية' },
          { id: 'travel-services', title: 'خدمات السفر', description: 'حجوزات الفنادق وتذاكر الطيران' },
        ],
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
        items: [
          { id: 'company-mainland', title: 'تسجيل الشركات (البر الرئيسي)', description: 'تأسيس شركة كاملة والحصول على إقامة في البر الرئيسي لعمان' },
          { id: 'company-freezone', title: 'تسجيل الشركات (المناطق الحرة)', description: 'أسس عملك في المناطق التجارية الحرة بعمان' },
          { id: 'license-renewal', title: 'تجديد السجل التجاري وبطاقة العمل', description: 'تجديد السجل التجاري وبطاقات العمل' },
          { id: 'residency-renewal', title: 'تجديد الإقامة', description: 'تجديد تصاريح الإقامة بدون متاعب' },
          { id: 'family-visa', title: 'تأشيرة الالتحاق العائلي', description: 'خدمات لم شمل العائلة' },
          { id: 'trademark', title: 'تسجيل العلامة التجارية', description: 'خدمات حماية العلامة التجارية' },
          { id: 'rental-contract', title: 'عقد الإيجار الرسمي (البلدية)', description: 'تسجيل عقد الإيجار الرسمي لدى البلدية' },
          { id: 'driving-license', title: 'إرشادات رخصة القيادة العمانية', description: 'المساعدة في الحصول على رخصة قيادة عمانية' },
          { id: 'company-liquidation', title: 'تصفية الشركات', description: 'خدمات الحل القانوني للشركات' },
          { id: 'personal-account', title: 'فتح حساب بنكي شخصي', description: 'خدمات إعداد الحساب البنكي الشخصي' },
          { id: 'corporate-account', title: 'فتح حساب بنكي للشركات', description: 'حلول مصرفية للشركات' },
          { id: 'vat-registration', title: 'التسجيل في ضريبة القيمة المضافة', description: 'التسجيل في ضريبة القيمة المضافة' },
          { id: 'tax-registration', title: 'التسجيل الضريبي', description: 'خدمات التسجيل الضريبي العام' },
          { id: 'tax-exemptions', title: 'الإعفاءات الضريبية الصناعية', description: 'الحصول على شهادات الإعفاء الضريبي الصناعي' },
          { id: 'residency-cancellation', title: 'إلغاء الإقامة', description: 'إجراءات إلغاء الإقامة الصحيحة' },
          { id: 'bayan', title: 'التخليص الجمركي (نظام بيان)', description: 'تخليص البضائع عبر نظام بيان' },
          { id: 'tax-filing', title: 'تقديم الإقرارات الضريبية', description: 'خدمات الإقرار وتقديم الضرائب' },
          { id: 'commercial-permits', title: 'التصاريح التجارية والصناعية والبيئية (EA)', description: 'الترخيص البيئي والتجاري' },
          { id: 'madayn', title: 'تصاريح المنطقة الصناعية مدائن (Madayn)', description: 'تصاريح التأسيس في المناطق الصناعية' },
          { id: 'made-in-oman', title: 'شهادة صنع في عمان', description: 'شهادة للمنتجات المصنعة محلياً' },
          { id: 'riyada', title: 'بطاقة ريادة', description: 'بطاقة دعم ومزايا المؤسسات الصغيرة والمتوسطة' },
          { id: 'pacda', title: 'تصاريح الدفاع المدني والبلدية (PACDA)', description: 'تصاريح السلامة والامتثال البلدي' },
          { id: 'standards', title: 'شهادة معايير المنتج (G-mark/DGSMM)', description: 'شهادة الجودة والمعايير' },
          { id: 'consulting', title: 'استشارات تأسيس الأعمال', description: 'استشارات إعداد الوحدات التجارية والصناعية' },
          { id: 'land-rental', title: 'إرشادات استئجار الأراضي الحكومية', description: 'المساعدة في استئجار أراضي المناطق الصناعية' },
          { id: 'feasibility', title: 'دراسة الجدوى وخطة العمل', description: 'خدمات تخطيط الأعمال الاحترافية' },
          { id: 'accounting', title: 'خدمات المحاسبة والتدقيق', description: 'خدمات المحاسبة والتدقيق الاحترافية' },
          { id: 'tourist-visa', title: 'خدمات التأشيرة السياحية', description: 'إصدار وتجديد التأشيرات السياحية' },
          { id: 'travel-services', title: 'خدمات السفر', description: 'حجوزات الفنادق وتذاكر الطيران' },
          { id: 'omanisation', title: 'إدارة التعمين', description: 'الامتثال لتأميم القوى العاملة' },
        ],
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
