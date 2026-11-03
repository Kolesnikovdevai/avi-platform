"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clock3,
  FlaskConical,
  LayoutDashboard,
  Link2,
  Menu,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { demo, type Period } from "@/data/demo";

const sections = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "accounts", label: "Аккаунты", icon: Wallet },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "settings", label: "Настройки", icon: Settings2 },
] as const;
type Section = (typeof sections)[number]["id"];

export function Dashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [period, setPeriod] = useState<Period>("week");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [series, setSeries] = useState<"both" | "spend" | "leads">("both");
  const [notice, setNotice] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstNavButton = useRef<HTMLButtonElement>(null);
  const data = demo.periods[period];
  const title = sections.find((item) => item.id === section)?.label ?? "Обзор";

  function navigate(id: Section) {
    setSection(id);
    setMobileOpen(false);
    setNotice("");
    requestAnimationFrame(() => document.getElementById("main")?.focus());
  }

  function closeMenu() {
    setMobileOpen(false);
    menuButton.current?.focus();
  }

  function openMenu() {
    setMobileOpen(true);
    requestAnimationFrame(() => firstNavButton.current?.focus());
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="Боковая панель"
        onKeyDown={(event) => {
          if (event.key === "Escape") closeMenu();
        }}
      >
        <Link className="brand" href="/" aria-label="AvitoPulse — начало">
          <span className="brand-mark">
            <Activity size={23} strokeWidth={2.5} />
          </span>
          <span>
            Avito<span className="brand-light">Pulse</span>
            <small>АНАЛИТИКА С ЯСНОСТЬЮ</small>
          </span>
        </Link>
        <button className="mobile-close icon-button" aria-label="Закрыть меню" onClick={closeMenu}>
          <X size={20} />
        </button>
        <div className="workspace">
          <span className="workspace-icon">Д</span>
          <span>
            <strong>Демоорганизация</strong>
            <small>Пример рабочего пространства</small>
          </span>
          <FlaskConical size={15} />
        </div>
        <p className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</p>
        <nav aria-label="Основная навигация">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              ref={id === "overview" ? firstNavButton : undefined}
              className={`nav-item ${section === id ? "active" : ""}`}
              aria-current={section === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "overview" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="beta-note">
            <span className="eyebrow">СОЗДАЁМ AVITOPULSE</span>
            <strong>
              Всё важное.
              <br />В одном кабинете.
            </strong>
            <p>От расходов до обращений — с понятным контекстом.</p>
            <span className="beta-pill">Закрытая бета · в разработке</span>
          </div>
          <button
            className="support-button"
            onClick={() =>
              setNotice(
                "Это локальный прототип. Канал поддержки будет определён перед закрытой бетой.",
              )
            }
          >
            <CircleHelp size={17} /> Помощь и поддержка
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-version">
            AvitoPulse <span>v0.1 / прототип</span>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button className="menu-backdrop" aria-label="Закрыть навигацию" onClick={closeMenu} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            ref={menuButton}
            aria-label="Открыть меню"
            aria-expanded={mobileOpen}
            onClick={openMenu}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Рабочее пространство
            <ChevronRight size={14} />
            <span>{title}</span>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span />
              Локальная демонстрация
            </span>
            <div className="topbar-divider" />
            <span className="avatar" title="Демонстрационный профиль">
              ДП
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">ВАШ БИЗНЕС В ЦИФРАХ</div>
              <h1>
                {section === "overview" ? "Обзор аналитики" : title}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {section === "overview"
                  ? "Понимайте расходы. Замечайте изменения. Принимайте решения."
                  : section === "accounts"
                    ? "Подключения и состояние данных в одном месте."
                    : section === "notifications"
                      ? "Важные изменения не должны оставаться незамеченными."
                      : "Рабочее пространство, доступ и предпочтения."}
              </p>
            </div>
            {(section === "overview" || section === "accounts") && (
              <label className="period-control">
                <Clock3 size={16} />
                <span className="sr-only">Отчётный период</span>
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as Period)}
                >
                  <option value="week">26 окт — 1 ноя 2026</option>
                  <option value="month">1 — 31 окт 2026</option>
                </select>
                <ChevronDown size={15} />
              </label>
            )}
          </div>
          <div className="demo-banner">
            <span className="demo-icon">
              <FlaskConical size={19} />
            </span>
            <div>
              <strong>Демонстрационный режим</strong>
              <span>Все цифры вымышлены. Аккаунты Авито не подключены.</span>
            </div>
            <span className="demo-tag">ПРЕВЬЮ КАБИНЕТА</span>
          </div>
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="Закрыть сообщение"
              >
                <X size={17} />
              </button>
            </div>
          )}
          {section === "overview" && (
            <>
              <section className="stats-grid" aria-label="Демонстрационные показатели">
                <Metric
                  title="Расходы"
                  value={data.spend}
                  detail="Условный состав расходов"
                  icon={<Wallet size={19} />}
                  accent="coral"
                  spark="0,26 15,23 30,27 45,15 60,21 75,9 90,15 105,3"
                />
                <Metric
                  title="Обращения"
                  value={data.leads}
                  detail="Условный показатель обращений"
                  icon={<MessageCircle size={19} />}
                  accent="blue"
                  spark="0,27 15,21 30,24 45,15 60,18 75,7 90,12 105,4"
                />
                <Metric
                  title="Стоимость обращения"
                  value={data.cpl}
                  detail="CPL · полный демопериод"
                  icon={<ChartNoAxesCombined size={19} />}
                  accent="amber"
                  spark="0,16 15,16 30,16 45,16 60,16 75,16 90,16 105,16"
                />
                <Metric
                  title="Аккаунты в примере"
                  value="02"
                  detail="Реальных подключений нет"
                  icon={<Link2 size={19} />}
                  accent="muted"
                />
              </section>
              <div className="analytics-grid">
                <section className="panel chart-panel" aria-labelledby="dynamics-title">
                  <div className="panel-heading">
                    <div>
                      <h2 id="dynamics-title">Динамика показателей</h2>
                      <p>{data.label} · синтетический пример</p>
                    </div>
                    <span className="panel-icon">
                      <ChartNoAxesCombined size={19} />
                    </span>
                  </div>
                  <div className="chart-controls" role="group" aria-label="Показатели графика">
                    {(
                      [
                        { id: "both", label: "Все показатели" },
                        { id: "spend", label: "Расходы" },
                        { id: "leads", label: "Обращения" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={series === item.id}
                        className={series === item.id ? "selected" : ""}
                        onClick={() => setSeries(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-line coral" />
                      Расходы, ₽
                    </span>
                    <span>
                      <i className="legend-line blue" />
                      Обращения, шт.
                    </span>
                    <span className="chart-note">Раздельные шкалы</span>
                  </div>
                  <div className="chart-wrap">
                    <svg
                      className="trend-chart"
                      viewBox="0 0 690 260"
                      role="img"
                      aria-labelledby="chart-title chart-description"
                    >
                      <title id="chart-title">Демонстрационная динамика расходов и обращений</title>
                      <desc id="chart-description">{data.accessibleSeries}</desc>
                      <defs>
                        <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FD8973" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#FD8973" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[40, 95, 150, 205].map((y, i) => (
                        <g key={y}>
                          <line
                            x1="40"
                            y1={y}
                            x2="640"
                            y2={y}
                            stroke="var(--border)"
                            strokeDasharray="3 6"
                          />
                          <text x="0" y={y + 4}>
                            {period === "week" ? ["3k", "2k", "1k", "0"][i] : ["", "", "", ""][i]}
                          </text>
                          {period === "week" && (
                            <text x="660" y={y + 4}>
                              {["12", "8", "4", "0"][i]}
                            </text>
                          )}
                        </g>
                      ))}
                      {series !== "leads" && (
                        <>
                          <polygon
                            points={`40,205 ${data.spendPoints} 640,205`}
                            fill="url(#spend-fill)"
                          />
                          <polyline
                            points={data.spendPoints}
                            stroke="var(--coral)"
                            strokeWidth="3"
                            fill="none"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      {series !== "spend" && (
                        <polyline
                          points={data.leadsPoints}
                          stroke="var(--chart-blue)"
                          strokeWidth="2.5"
                          fill="none"
                          strokeDasharray="6 6"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      )}
                      {data.axis.map((label, i) => (
                        <text
                          key={label}
                          className={i % 2 ? "axis-date intermediate-date" : "axis-date"}
                          x={40 + i * 100}
                          y="250"
                          textAnchor="middle"
                        >
                          {label}
                        </text>
                      ))}
                    </svg>
                  </div>
                  <details className="chart-details">
                    <summary>Данные и описание графика</summary>
                    <p>
                      {data.accessibleSeries} График демонстрационный. Показатели не подтверждены
                      контрактом Авито.
                    </p>
                  </details>
                </section>
                <section className="panel period-panel" aria-labelledby="period-title">
                  <div className="panel-heading">
                    <div>
                      <h2 id="period-title">В фокусе</h2>
                      <p>Картина за выбранный период</p>
                    </div>
                    <ArrowUpRight size={19} />
                  </div>
                  <div className="focus-visual">
                    <div className="focus-ring">
                      <span>
                        2<small>демоаккаунта</small>
                      </span>
                    </div>
                    <span className="ring-orbit orbit-one" />
                    <span className="ring-orbit orbit-two" />
                  </div>
                  <div className="distribution">
                    <span>
                      <i className="dot blue" />
                      Мастерская мебели
                    </span>
                    <strong>62,5%</strong>
                  </div>
                  <div className="distribution-bar">
                    <span />
                  </div>
                  <div className="distribution">
                    <span>
                      <i className="dot coral" />
                      Дом и ремонт
                    </span>
                    <strong>37,5%</strong>
                  </div>
                  <p className="focus-caption">
                    Доля расходов в синтетическом примере. Не оценка эффективности.
                  </p>
                </section>
              </div>
            </>
          )}
          {(section === "overview" || section === "accounts") && (
            <section className="panel accounts-panel" aria-labelledby="accounts-title">
              <div className="panel-heading">
                <div>
                  <h2 id="accounts-title">
                    {section === "overview" ? "Ваши аккаунты" : "Демонстрационные аккаунты"}
                    <span className="count-badge">2</span>
                  </h2>
                  <p>Вымышленные аккаунты · {data.label}</p>
                </div>
                {section === "overview" ? (
                  <button className="text-button" onClick={() => navigate("accounts")}>
                    Все аккаунты
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    onClick={() =>
                      setNotice(
                        "Подключение Авито пока недоступно. Сначала нужны подтверждённый контракт API, авторизация и tenant-изоляция.",
                      )
                    }
                  >
                    <Link2 size={16} />О подключении
                  </button>
                )}
              </div>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Таблица аккаунтов с горизонтальной прокруткой"
              >
                <table>
                  <caption className="sr-only">
                    Синтетические данные аккаунтов за {data.label}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Аккаунт</th>
                      <th scope="col">Состояние</th>
                      <th scope="col" className="numeric">
                        Расходы
                      </th>
                      <th scope="col" className="numeric">
                        Обращения
                      </th>
                      <th scope="col" className="numeric">
                        CPL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.name}>
                        <td>
                          <div className="account-cell">
                            <span className={`account-avatar ${row.color}`}>{row.initials}</span>
                            <span>
                              <strong>{row.name}</strong>
                              <small>{row.category}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="demo-state">
                            <FlaskConical size={12} />
                            Пример
                          </span>
                        </td>
                        <td className="numeric money">{row.spend}</td>
                        <td className="numeric">{row.leads}</td>
                        <td className="numeric">{row.cpl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  <ShieldCheck size={14} />
                  Демоданные изолированы от реальных расчётов
                </span>
                <span>Обновление: не применимо</span>
              </div>
            </section>
          )}
          {section === "notifications" && (
            <section className="panel empty-panel">
              <span className="empty-icon">
                <Bell size={34} />
              </span>
              <span className="eyebrow">TELEGRAM · СКОРО</span>
              <h2>Важное придёт вовремя</h2>
              <p>
                Планируем уведомления о свежести данных, расходах и CPL за закрытый отчётный день.
                Правила появятся после проверки интеграции.
              </p>
              <div className="feature-tags">
                <span>
                  <Check size={15} />
                  Личные чаты
                </span>
                <span>
                  <Check size={15} />
                  Контроль частоты
                </span>
                <span>
                  <Check size={15} />
                  Отзыв доступа
                </span>
              </div>
              <button
                className="primary-button"
                onClick={() =>
                  setNotice(
                    "Telegram пока не подключён. На этом этапе сообщения не отправляются, токен бота не требуется.",
                  )
                }
              >
                <MessageCircle size={17} />
                Как будет работать привязка
              </button>
              <p className="empty-footnote">
                Пользователь создаст одноразовый код в кабинете и подтвердит его в личном чате с
                ботом.
              </p>
            </section>
          )}
          {section === "settings" && (
            <section className="panel settings-panel">
              <div className="panel-heading">
                <div>
                  <h2>Рабочее пространство</h2>
                  <p>Параметры демонстрационного прототипа</p>
                </div>
                <Settings2 size={20} />
              </div>
              <dl className="settings-list">
                <div>
                  <dt>Организация</dt>
                  <dd>Демоорганизация</dd>
                </div>
                <div>
                  <dt>Язык интерфейса</dt>
                  <dd>Русский</dd>
                </div>
                <div>
                  <dt>Зона отображения</dt>
                  <dd>Europe/Moscow</dd>
                </div>
                <div>
                  <dt>Реальные подключения</dt>
                  <dd>Отсутствуют</dd>
                </div>
                <div>
                  <dt>Доступ и приглашения</dt>
                  <dd>Следующий этап разработки</dd>
                </div>
              </dl>
              <div className="settings-note">
                <CircleUserRound size={20} />
                <p>
                  Это локальное превью без входа и клиентских данных. Управление организацией станет
                  доступно после реализации сессий и ролей.
                </p>
              </div>
            </section>
          )}
          {section === "overview" && (
            <div className="insight-strip">
              <span className="insight-icon">
                <ArrowDownLeft size={21} />
              </span>
              <p>
                <strong>За цифрами всегда должен быть контекст.</strong>
                <span>
                  В рабочем кабинете здесь появятся покрытие периода, источник и свежесть данных.
                </span>
              </p>
              <span className="insight-label">ПРОЗРАЧНАЯ АНАЛИТИКА</span>
            </div>
          )}
          <footer className="page-footer">
            <span>
              © 2026 AvitoPulse<span className="footer-separator">/</span>Независимый сервис
              аналитики
            </span>
            <span>Дизайн-прототип · синтетические данные</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  detail,
  icon,
  accent,
  spark,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
  spark?: string;
}) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <div className="metric-top">
        <span>{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-middle">
        <strong>{value}</strong>
        {spark && (
          <svg width="90" height="38" viewBox="0 0 110 34" aria-hidden="true">
            <polyline
              points={spark}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <p>{detail}</p>
    </article>
  );
}
