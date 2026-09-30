import { Icon, type IconName } from "../components/Icon";
import { PrivacyNote } from "../components/PrivacyNote";

const PATHS: Array<{
  to: string;
  icon: IconName;
  title: string;
  body: string;
}> = [
  {
    to: "#/analyze",
    icon: "upload",
    title: "آپلود تصویر",
    body: "یک عکس از فرد نشسته انتخاب کنید و نتیجهٔ کامل را ببینید.",
  },
  {
    to: "#/capture",
    icon: "camera",
    title: "استفاده از وبکم",
    body: "با دوربین خودتان عکس بگیرید و همان لحظه تحلیل کنید.",
  },
  {
    to: "#/live",
    icon: "live",
    title: "شروع تحلیل زنده",
    body: "معیارها را هنگام نشستن، به‌صورت پیوسته دنبال کنید.",
  },
];

const FLOW = [
  { en: "Capture", fa: "ثبت", body: "تصویر یا دوربین" },
  { en: "Detect", fa: "تشخیص", body: "یافتن بدن در قاب" },
  { en: "Assess", fa: "ارزیابی", body: "پنج معیار و امتیاز" },
  { en: "Explain", fa: "توضیح", body: "معنی هر معیار" },
  { en: "Improve", fa: "بهبود", body: "پیشنهاد اصلاحی" },
];

const METRIC_NAMES = [
  { name: "CVA", tier: "Tier 1" },
  { name: "Trunk Flexion", tier: "Tier 1" },
  { name: "Spine Alignment", tier: "Tier 1" },
  { name: "Head Tilt", tier: "Tier 2" },
  { name: "Trunk Lateral", tier: "Tier 2" },
];

export function HomePage() {
  return (
    <div className="page">
      <div className="bento">
      <section className="hero">
        <p className="eyebrow">PAW</p>
        <h1 className="hero__title">
          وضعیت نشستن خود را <span className="hero__accent">با دوربین</span>{" "}
          تحلیل کنید
        </h1>
        <p className="hero__lead">
          PAW سر، شانه‌ها و تنهٔ شما را در تصویر بررسی می‌کند، پنج معیار وضعیت نشستن
          را نشان می‌دهد و توضیح می‌دهد هر کدام چه معنایی دارد.
        </p>
      </section>

      <aside className="tile" aria-labelledby="tile-heading">
        <h2 id="tile-heading" className="tile__title">
          پنج معیار، یک نگاه
        </h2>
        <ul className="tile__list">
          {METRIC_NAMES.map((metric) => (
            <li key={metric.name}>
              <bdi dir="ltr">{metric.name}</bdi>
              <span className="tile__tag">{metric.tier}</span>
            </li>
          ))}
        </ul>
      </aside>
      </div>

      <section aria-labelledby="paths-heading">
        <h2 id="paths-heading" className="sr-only">
          روش‌های ورودی
        </h2>
        <ul className="paths">
          {PATHS.map((path) => (
            <li key={path.to}>
              <a className="path-card" href={path.to}>
                <span className="path-card__icon">
                  <Icon name={path.icon} size={24} />
                </span>
                <span className="path-card__title">{path.title}</span>
                <span className="path-card__body">{path.body}</span>
                <span className="path-card__go" aria-hidden="true">
                  <Icon name="arrow" size={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="flow-heading">
        <h2 id="flow-heading" className="card__title">
          PAW چگونه کار می‌کند
        </h2>
        <ol className="flow">
          {FLOW.map((step, index) => (
            <li key={step.en} className="flow__item">
              <span className="flow__num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="flow__fa">{step.fa}</span>
              <span className="flow__en" lang="en" dir="ltr">
                {step.en}
              </span>
              <span className="flow__body">{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <PrivacyNote />
    </div>
  );
}
