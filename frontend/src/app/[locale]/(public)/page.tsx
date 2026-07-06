'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

/**
 * Landing page component for the Booking SaaS barbershop appointment platform.
 * Features a hero section with animated backgrounds, How It Works tabs for
 * 3 user types (Owner, Staff, Customer), features showcase with animated cards,
 * pricing plans, FAQ accordion, final CTA, and footer.
 *
 * The page supports Arabic/English via next-intl translations and includes
 * scroll-triggered navigation styling and smooth CSS animations.
 */
export default function LandingPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'ar'
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<'owner' | 'staff' | 'customer'>('customer')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="bg-bg text-text-primary">
      {/* ===== NAVIGATION ===== */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all ${
          scrolled
            ? 'neu-card shadow-lg'
            : 'border-b border-text-muted/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">💇 Barber SaaS</h1>

          <div className="hidden md:flex gap-8">
            <a href="#how-it-works" className="text-text-secondary hover:text-primary transition">
              {t('nav.how_it_works')}
            </a>
            <a href="#features" className="text-text-secondary hover:text-primary transition">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="text-text-secondary hover:text-primary transition">
              {t('nav.pricing')}
            </a>
          </div>

          <Link href={`/${locale}/login`}>
            <Button variant="primary" size="sm">
              {t('auth.login')}
            </Button>
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20 pb-20 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />

        <div className="max-w-4xl mx-auto text-center z-10">
          {/* Main Heading with animation */}
          <div
            className="animate-fade-in-up"
            style={{
              animationDelay: '0s',
              animationFillMode: 'both',
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-primary mb-6">
              {t('hero.title')}
            </h1>
            {/* English subtitle */}
            <p className="text-2xl md:text-3xl text-text-secondary mb-8">
              Smart Barbershop Booking System
            </p>
          </div>

          {/* Description */}
          <div
            className="animate-fade-in-up mb-12"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'both',
            }}
          >
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-6">
              {t('hero.description')}
            </p>
            <p className="text-lg text-text-secondary/80">
              نظام حجوزات ذكي يوفر لك إدارة كاملة لعملائك وحجوزاتك وموظفيك
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col md:flex-row gap-4 justify-center mb-16 animate-fade-in-up"
            style={{
              animationDelay: '0.4s',
              animationFillMode: 'both',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/${locale}/find-business`)}
              className="neu-btn-primary transform hover:scale-105 transition-transform"
            >
              {t('hero.book_now')} →
            </Button>

            <Link href={`/${locale}/register`}>
              <Button
                variant="default"
                size="lg"
                className="neu-btn transform hover:scale-105 transition-transform w-full"
              >
                {t('hero.get_started')}
              </Button>
            </Link>
          </div>

          {/* Hero Image / Illustration */}
          <div
            className="animate-fade-in-up animate-bounce-slow"
            style={{
              animationDelay: '0.6s',
              animationFillMode: 'both',
            }}
          >
            <div className="neu-card p-8 inline-block max-w-md">
              <div className="text-6xl">💇‍♂️</div>
              <p className="text-sm text-text-secondary mt-4">
                Join 150+ barbershops already using Barber SaaS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - 3 USER TYPES ===== */}
      <section id="how-it-works" className="py-20 px-4 bg-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-primary text-center mb-4">
            {t('landing.how_it_works')}
          </h2>
          <p className="text-center text-text-secondary mb-16 max-w-2xl mx-auto">
            {t('landing.how_it_works_description')}
          </p>

          {/* Tab Selection */}
          <div className="flex justify-center gap-4 mb-12">
            {([
              { id: 'owner', icon: '🏢', label: 'صاحب المشروع' },
              { id: 'staff', icon: '💇', label: 'الموظف' },
              { id: 'customer', icon: '👤', label: 'العميل' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`neu-btn px-6 py-3 transition-all transform hover:scale-105 ${
                  activeTab === tab.id ? 'neu-slot-selected' : ''
                }`}
              >
                <span className="text-2xl mr-2">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ===== OWNER EXAMPLE ===== */}
          {activeTab === 'owner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              <div className="neu-card p-8 space-y-4">
                <h3 className="text-2xl font-bold text-primary">
                  للمالك: إدارة كاملة 🏢
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">لوحة تحكم سهلة</div>
                      <div className="text-sm text-text-secondary">
                        ادرِ كل شيء من مكان واحد
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">إدارة الحجوزات</div>
                      <div className="text-sm text-text-secondary">
                        احظر كل الحجوزات في التقويم
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">إدارة الموظفين</div>
                      <div className="text-sm text-text-secondary">
                        أضِف موظفين وحدد ساعاتهم
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تتبع الإحصائيات</div>
                      <div className="text-sm text-text-secondary">
                        اعرف عدد الحجوزات والدخل
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تقليل الغياب</div>
                      <div className="text-sm text-text-secondary">
                        تذكيرات تلقائية عبر واتساب
                      </div>
                    </div>
                  </div>
                </div>

                <Link href={`/${locale}/register`}>
                  <Button variant="primary" className="w-full mt-6">
                    {t('hero.get_started')}
                  </Button>
                </Link>
              </div>

              <div className="neu-card p-8 space-y-6">
                <h4 className="text-lg font-bold text-primary">مثال - اليوم الأول:</h4>

                <div className="space-y-4">
                  {[
                    {
                      num: '1',
                      title: 'أنشئ حسابك',
                      desc: 'بريد + كلمة مرور + بيانات المشروع',
                    },
                    {
                      num: '2',
                      title: 'أضِف موظفيك',
                      desc: 'كل موظف يحصل على حسابه الخاص',
                    },
                    {
                      num: '3',
                      title: 'أضِف الخدمات',
                      desc: 'حلاقة، لحية، تسريح، إلخ',
                    },
                    {
                      num: '4',
                      title: 'شارك رابط الحجز',
                      desc: 'أرسل الرابط للعملاء عبر واتساب',
                    },
                    {
                      num: '5',
                      title: 'استقبل الحجوزات',
                      desc: 'عملاؤك يحجزون أونلاين تلقائياً',
                    },
                  ].map((step) => (
                    <div key={step.num} className="flex gap-4">
                      <div className="neu-btn w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary">
                        {step.num}
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{step.title}</div>
                        <div className="text-sm text-text-secondary">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== STAFF EXAMPLE ===== */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              <div className="neu-card p-8 space-y-4">
                <h3 className="text-2xl font-bold text-primary">
                  للموظف: عرض حجوزاتك 💇
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">جدول يومي واضح</div>
                      <div className="text-sm text-text-secondary">
                        اعرف حجوزاتك لليوم الكامل
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تفاصيل العميل</div>
                      <div className="text-sm text-text-secondary">
                        أسماء العملاء والخدمات المطلوبة
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تحديث الحالة</div>
                      <div className="text-sm text-text-secondary">
                        قُل إن الحجز اكتمل أو العميل لم يحضر
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تتبع الأداء</div>
                      <div className="text-sm text-text-secondary">
                        أرقام الحجوزات والتقييمات
                      </div>
                    </div>
                  </div>
                </div>

          <Link href={`/${locale}/login`}>
                  <Button variant="primary" className="w-full mt-6">
                    دخول الموظف
                  </Button>
                </Link>
              </div>

              <div className="neu-card p-8 space-y-6">
                <h4 className="text-lg font-bold text-primary">يوم الموظف النموذجي:</h4>

                <div className="space-y-4">
                  <div className="neu-card-inner p-4 bg-bg">
                    <div className="text-sm text-text-secondary">8:00 ص</div>
                    <div className="font-semibold">👤 محمد - حلاقة عادية</div>
                    <div className="text-sm text-text-secondary">30 دقيقة - 50 ج.م</div>
                  </div>

                  <div className="neu-card-inner p-4 bg-bg">
                    <div className="text-sm text-text-secondary">8:35 ص</div>
                    <div className="font-semibold">👤 أحمد - حلاقة + لحية</div>
                    <div className="text-sm text-text-secondary">45 دقيقة - 100 ج.م</div>
                  </div>

                  <div className="neu-card-inner p-4 bg-bg">
                    <div className="text-sm text-text-secondary">9:30 ص</div>
                    <div className="font-semibold">👤 خالد - لحية فقط</div>
                    <div className="text-sm text-text-secondary">20 دقيقة - 40 ج.م</div>
                  </div>

                  <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                    <div className="font-bold text-primary">اليوم حتى الآن:</div>
                    <div className="text-sm text-text-secondary">
                      3 حجوزات مكتملة = 190 ج.م
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CUSTOMER EXAMPLE ===== */}
          {activeTab === 'customer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              <div className="neu-card p-8 space-y-4">
                <h3 className="text-2xl font-bold text-primary">
                  للعميل: احجز بسهولة 👤
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">بدون تطبيق</div>
                      <div className="text-sm text-text-secondary">
                        احجز مباشرة من الرابط
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">اختر الموقع والوقت</div>
                      <div className="text-sm text-text-secondary">
                        شُف الأوقات المتاحة حالاً
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تأكيد فوري</div>
                      <div className="text-sm text-text-secondary">
                        تلقَّ رسالة واتساب بالحجز
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">تذكيرات تلقائية</div>
                      <div className="text-sm text-text-secondary">
                        تنبيهات قبل الموعد
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold">إلغاء سهل</div>
                      <div className="text-sm text-text-secondary">
                        ألغِ الحجز من الرسالة
                      </div>
                    </div>
                  </div>
                </div>

                <Link href={`/${locale}/find-business`}>
                  <Button variant="primary" className="w-full mt-6">
                    {t('booking.find_business')}
                  </Button>
                </Link>
              </div>

              <div className="neu-card p-8 space-y-6">
                <h4 className="text-lg font-bold text-primary">{t('landing.how_it_works')}:</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-semibold">ادخل رابط حلاقك</div>
                      <div className="text-sm text-text-secondary">
                        ahmedbarbershop.barber-saas.com
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-semibold">اختر الخدمة والوقت</div>
                      <div className="text-sm text-text-secondary">
                        حلاقة عادية - الجمعة 3 مساءً
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-semibold">أدخل رقم هاتفك</div>
                      <div className="text-sm text-text-secondary">
                        +201001234567
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-semibold">تحقق من الكود</div>
                      <div className="text-sm text-text-secondary">
                        كود من واتساب
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      ✅
                    </div>
                    <div>
                      <div className="font-semibold text-accent">تم الحجز!</div>
                      <div className="text-sm text-text-secondary">
                        تنبيهات تلقائية قبل الموعد
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-primary text-center mb-16">
            المميزات الرئيسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '📅',
                title: 'تقويم ذكي',
                desc: 'اعرض كل الحجوزات في تقويم جميل وسهل الاستخدام',
              },
              {
                icon: '💬',
                title: 'تنبيهات واتساب',
                desc: 'تذكيرات تلقائية للعملاء قبل الموعد',
              },
              {
                icon: '📊',
                title: 'إحصائيات',
                desc: 'تتبع دخلك وأداء موظفيك بسهولة',
              },
              {
                icon: '👥',
                title: 'إدارة الموظفين',
                desc: 'أضِف موظفين وحدد مهاراتهم والأوقات المتاحة',
              },
              {
                icon: '🔐',
                title: 'آمن وموثوق',
                desc: 'بيانات عملائك محمية بأعلى معايير الأمان',
              },
              {
                icon: '🎨',
                title: 'تخصيص كامل',
                desc: 'استخدم اسم عملك وشعارك الخاص',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="neu-card p-6 hover:neu-card-hover transition-all transform hover:scale-105 animate-fade-in-up"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  animationFillMode: 'both',
                }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4 bg-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-primary text-center mb-4">
            التسعير البسيط
          </h2>
          <p className="text-center text-text-secondary mb-16 max-w-2xl mx-auto">
            ابدأ مجاناً. ثم 100 ج.م/شهر فقط عندما تصبح جاهزاً
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'تجريبي',
                price: 'مجاني',
                duration: '14 يوم',
                features: [
                  'إضافة موظف واحد',
                  'خدمات غير محدودة',
                  'حجوزات غير محدودة',
                  'تقويم أساسي',
                ],
              },
              {
                name: 'احترافي',
                price: '100 ج.م',
                duration: 'شهرياً',
                features: [
                  'موظفين غير محدودين',
                  'فروع غير محدودة',
                  'تقويم متقدم',
                  'تحليلات كاملة',
                  'أولوية في الدعم',
                ],
                highlighted: true,
              },
              {
                name: 'عملي',
                price: '200 ج.م',
                duration: 'شهرياً',
                features: [
                  'كل ما في الاحترافي',
                  'دعم 24/7',
                  'تخصيص كامل',
                  'تدريب الفريق',
                  'API للتطبيقات الأخرى',
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`neu-card p-8 transition-all transform hover:scale-105 ${
                  plan.highlighted ? 'neu-card-highlighted border-2 border-primary' : ''
                }`}
              >
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-text-secondary"> / {plan.duration}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-accent">✓</span>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/${locale}/register`}>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'default'}
                    className="w-full"
                  >
                    {t('hero.get_started')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-primary text-center mb-16">
            الأسئلة الشائعة
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'هل يمكنني الرجوع للخطة المجانية؟',
                a: 'نعم، يمكنك الترقية أو التنزيل في أي وقت بدون عقد.',
              },
              {
                q: 'كم موظفاً يمكنني إضافة؟',
                a: 'في الخطة المجانية: موظف واحد. في الخطط المدفوعة: عدد غير محدود.',
              },
              {
                q: 'هل عملائي يحتاجون تطبيق؟',
                a: 'لا، يحجزون مباشرة من رابط الويب أو رسالة واتساب.',
              },
              {
                q: 'كيف يحصل عملائي على التذكيرات؟',
                a: 'نرسل رسائل واتساب تلقائية قبل الحجز بيوم واحد.',
              },
              {
                q: 'هل يمكنني إلغاء الاشتراك؟',
                a: 'نعم، في أي وقت بدون رسوم إضافية. بياناتك تبقى آمنة.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="neu-card p-6">
                <h3 className="text-lg font-bold text-primary mb-3">
                  {faq.q}
                </h3>
                <p className="text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-4 bg-bg">
        <div className="max-w-4xl mx-auto text-center neu-card p-12">
          <h2 className="text-4xl font-bold text-primary mb-6">
            جاهز للبدء؟
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            انضم إلى 150+ مشروع حلاقة يستخدمون Barber SaaS
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href={`/${locale}/register`}>
              <Button variant="primary" size="lg" className="transform hover:scale-105">
                {t('hero.get_started')}
              </Button>
            </Link>

            <Link href={`/${locale}/find-business`}>
              <Button variant="default" size="lg" className="transform hover:scale-105">
                {t('hero.book_now')}
              </Button>
            </Link>
          </div>

          <p className="text-sm text-text-secondary mt-6">
            لا تحتاج بطاقة ائتمان. بدون عقد. ألغِ في أي وقت.
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4 bg-surface border-t border-text-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-primary mb-4">Barber SaaS</h4>
              <p className="text-sm text-text-secondary">
                منصة حجوزات ذكية لمشاريعك
              </p>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-4">للمالك</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#">لوحة التحكم</a></li>
                <li><a href="#">التسعير</a></li>
                <li><a href="#">الدعم</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-4">للعميل</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#">احجز الآن</a></li>
                <li><a href="#">تطبيق الويب</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-4">القانوني</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#">سياسة الخصوصية</a></li>
                <li><a href="#">شروط الخدمة</a></li>
                <li><a href="#">الاتصال</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-text-muted/20 pt-8 text-center text-sm text-text-secondary">
            <p>© 2026 Barber SaaS. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
