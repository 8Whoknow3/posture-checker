import { StatusBadge } from "../components/StatusBadge";
import {
  HELP_INTRO,
  HELP_OUTRO,
  METRIC_HELP,
  STATUS_HELP,
  type HelpTopic,
} from "../content/help";

function Topics({ topics }: { topics: HelpTopic[] }) {
  return (
    <div className="help-grid">
      {topics.map((topic) => (
        <article key={topic.id} className="card" id={topic.id}>
          <h3 className="card__title">{topic.title}</h3>
          <p>{topic.body}</p>
        </article>
      ))}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">راهنما</h1>
        <p className="page__lead">
          هر آنچه برای خواندن نتیجهٔ PAW لازم است، کوتاه و روشن.
        </p>
      </header>

      <Topics topics={HELP_INTRO} />

      <section aria-labelledby="metrics-help">
        <h2 id="metrics-help" className="section-title">
          پنج معیار
        </h2>
        <Topics topics={METRIC_HELP} />
      </section>

      <Topics topics={HELP_OUTRO} />

      <section className="card" aria-labelledby="status-help">
        <h2 id="status-help" className="card__title">
          معنی وضعیت‌ها
        </h2>
        <dl className="status-list">
          {STATUS_HELP.map((item) => (
            <div key={item.status} className="status-list__row">
              <dt>
                <StatusBadge status={item.status} label={item.label} />
              </dt>
              <dd>{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card" aria-labelledby="about-help">
        <h2 id="about-help" className="card__title">
          دربارهٔ پروژه
        </h2>
        <p>
          PAW رابط کاربری پروژهٔ دانشگاهی زیر است. نتایج راهنما هستند و جایگزین
          نظر متخصص نیستند.
        </p>
        <p className="about__title" dir="ltr" lang="en">
          Posture Checker — Design and Implementation of a Sitting Posture
          Detection and Assessment System Using Computer Vision
        </p>
      </section>
    </div>
  );
}
