import "server-only";
import { siteSchema } from "./schema";

export const site = siteSchema.parse(
{
  "meta": {
    "siteTitle": "Joshua Santiago | AI-native software engineer",
    "siteDescription": "AI-native software engineer in Puerto Rico. I build production systems for regulated work and multi-agent Claude Code workflows, and I measure the results.",
    "ogTitle": "Joshua Santiago: what I built, with the numbers",
    "ogDescription": "Eight case studies: an agent operating system, a production reporting platform, a bilingual field app, and a negative LLM evaluation.",
    "name": "Joshua Santiago",
    "roleLine": "Construction Coordinator / AI Developer / IT at Jacobs, Life Sciences Americas, Puerto Rico",
    "location": "Guaynabo, Puerto Rico",
    "links": {
      "github": "https://github.com/Joshua7792",
      "linkedin": "https://www.linkedin.com/in/joshua-santiago00",
      "resumePdf": "/resume/joshua-santiago-resume.pdf"
    }
  },
  "nav": {
    "items": [{"label":"About","href":"#about"},{"label":"Work","href":"#work"},{"label":"Experience","href":"#experience"}],
    "ctaDesktop": "Resume",
    "ctaMobile": "Download Resume"
  },
  "hero": {
    "displayWord": "SANTIAGO",
    "eyebrow": "AI-native engineer, Puerto Rico",
    "headline": "I build multi-agent systems and production software for regulated industries.",
    "subline": "AI-native software engineer shipping production systems in life sciences, medical devices and HIPAA work. I build and operate multi-agent systems with Claude Code daily.",
    "handles": ["GH:/Joshua7792","LI:/joshua-santiago00","LOC: Puerto Rico"],
    "scrollBadge": "Scroll down",
    "portraitAlt": "Portrait of Joshua Santiago"
  },
  "about": {
    "heading": "The only technical person in the office",
    "bio": "I coordinate construction at Jacobs, Life Sciences Americas, in Puerto Rico. I am also the only technical person in my office. I built the dashboards, reports and workflows our project runs on, and I am building its field app. When a computer or network breaks, I fix that too. Before Jacobs, I built validated MES apps for a medical device maker and HIPAA-compliant storage for a health plan. At Granicus I built CI/CD pipelines in Azure DevOps and GitHub Actions. I measure what I build and publish the misses.",
    "chips": ["Bilingual EN / ES","Azure AZ-204 certified","Tulip Advanced certified","Claude Code, every day"],
    "portraitAlt": "Headshot of Joshua Santiago"
  },
  "proofGrid": {
    "heading": "What the job asks, what I built",
    "rows": [
      {
        "label": "Agents, MCP, tool calling",
        "asks": "Build AI agents and agentic workflows with tool calling and MCP.",
        "built": "I assembled and operate 66 Claude Code subagents, each with its own tool allow-list, plus Playwright, Exa and Supabase MCP servers.",
        "href": "/work/joshua-os"
      },
      {
        "label": "AI evaluation, regression testing",
        "asks": "Evaluate models and agents; regression-test AI output.",
        "built": "A pre-registered test scored 17,005 model calls with bootstrap CIs and cached replays. The model failed, and I published it.",
        "href": "/work/jevtrade"
      },
      {
        "label": "Production Python, FastAPI, ETL",
        "asks": "Production Python, FastAPI services and data pipelines.",
        "built": "2,409 lines of Python ETL and FastAPI readers run in-process, feeding a 26-view dashboard in active project use.",
        "href": "/work/jacobs-reporting-platform"
      },
      {
        "label": "CI/CD, source control, AI-assisted SDLC",
        "asks": "CI/CD, source control, and Claude Code as the main development environment.",
        "built": "GitHub Actions with SHA-pinned actions and gitleaks. 27 parallel worktree lanes merged. Azure DevOps CI/CD at Granicus and Alpine.",
        "href": "/work/jacobs-field-app"
      },
      {
        "label": "Security in regulated environments",
        "asks": "Security-first delivery; HIPAA and compliance controls when required.",
        "built": "Audit trails in validated MES apps, HIPAA storage at a health plan, row-level security on all 12 field-app tables, plus MFA.",
        "href": "/work/tulip-mes"
      },
      {
        "label": "Bilingual delivery",
        "asks": "Fully bilingual English and Spanish.",
        "built": "Native Spanish, fluent English. The field app ships ES and EN, 173 keys each, with a CI parity check.",
        "href": "/work/jacobs-field-app"
      }
    ]
  },
  "work": {
    "sectionHeading": "Work, with the numbers",
    "intro": "Eight projects. Each status is stated plainly, and each number was counted from code, logs or git history.",
    "projects": [
      {
        "slug": "joshua-os",
        "title": "Joshua-OS",
        "oneLine": "My Claude Code operating system: rules, SOP, agents and parallel worktree lanes.",
        "status": "In production",
        "stack": "Claude Code; Markdown agents and skills; Bash; PowerShell; Python; GitHub Actions",
        "featured": true,
        "coverAlt": "Table of Claude Code subagents with each role and model tier",
        "metrics": [
          {"value":"190","label":"commits since Aug 19, 2026"},
          {"value":"27","label":"parallel worktree lanes merged"},
          {"value":"66","label":"subagents assembled and operated, many from plugins"}
        ]
      },
      {
        "slug": "jacobs-reporting-platform",
        "title": "Jacobs reporting and compliance platform",
        "oneLine": "Excel and P6 exports in, one zero-install 26-view dashboard out.",
        "status": "In production",
        "stack": "Python 3.11; openpyxl; FastAPI; vanilla JavaScript; hand-written SVG charts; Windows batch",
        "featured": true,
        "coverAlt": "Command Center view of the dashboard, rendered on synthetic data",
        "metrics": [
          {"value":"26","label":"hash-routed views"},
          {"value":"2,409","label":"lines of Python ETL"},
          {"value":"0","label":"installs to open it"}
        ]
      },
      {
        "slug": "jevtrade",
        "title": "JevTrade",
        "oneLine": "A pre-registered test showed the model did worse than a coin flip.",
        "status": "Paper / sandbox",
        "stack": "Python 3.12; pytest; ruff; uv; Alpaca paper API; TypeSafe Jev API",
        "featured": true,
        "coverAlt": "Scorer output comparing the model's hit rate and confidence interval with two baselines",
        "metrics": [
          {"value":"17,005","label":"scored model calls"},
          {"value":"47.3%","label":"hit rate vs 50.9% for always up"},
          {"value":"1,275","label":"tests passing, as recorded"}
        ]
      },
      {
        "slug": "jacobs-field-app",
        "title": "Jacobs field app",
        "oneLine": "Bilingual Expo app moving project data into Postgres with row-level security.",
        "status": "In progress",
        "stack": "Expo 57; React Native 0.86; TypeScript; Supabase Postgres; Jest and Playwright; GitHub Actions",
        "featured": true,
        "coverAlt": "Design-system gallery of the field app at desktop width, light theme",
        "metrics": [
          {"value":"12","label":"tables, row-level security on every one"},
          {"value":"25","label":"security policies"},
          {"value":"173","label":"keys each in Spanish and English"}
        ]
      },
      {
        "slug": "megateam",
        "title": "MegaTeam",
        "oneLine": "Code scans new tokens, Jev judges the uncertain ones, code decides. Shadow only.",
        "status": "Paper / sandbox",
        "stack": "Python 3.11; FastAPI; pydantic; SQLite; Telegram Bot API; Windows Task Scheduler",
        "featured": false,
        "coverAlt": "Funnel diagram from the MegaTeam README, from token scan to pick",
        "metrics": [
          {"value":"59","label":"shadow scan cycles logged"},
          {"value":"325","label":"Jev judge calls"},
          {"value":"-93.9%","label":"paper trade #1 at close"}
        ]
      },
      {
        "slug": "btc-paper-bot",
        "title": "BTC 5-minute paper bot",
        "oneLine": "Claude calls BTC up or down every 5 minutes; code decides the fake bet.",
        "status": "Paper / sandbox",
        "stack": "Node 22; ES modules; node --test; Claude CLI; Binance public API",
        "featured": false,
        "coverAlt": "Terminal runner window printing one line per 5-minute cycle",
        "metrics": [
          {"value":"186","label":"Claude calls logged"},
          {"value":"0","label":"bets placed so far"},
          {"value":"218","label":"tests, 97.75% coverage"}
        ]
      },
      {
        "slug": "tulip-mes",
        "title": "Tulip MES apps",
        "oneLine": "Paper shop-floor records rebuilt as validated, step-driven Tulip apps.",
        "status": "Shipped",
        "stack": "Tulip; Jira",
        "featured": false,
        "coverAlt": "Typographic cover card for the Tulip MES project; client screens stay private",
        "metrics": [
          {"value":"2","label":"Tulip developer certifications"},
          {"value":"UAT","label":"supported before production release"},
          {"value":"Audit trail","label":"capture built into the apps"}
        ]
      },
      {
        "slug": "blog-poster",
        "title": "blog-poster",
        "oneLine": "Exa search, Firecrawl scrape, source-grounded draft, one HTML post.",
        "status": "Shipped",
        "stack": "Python; Exa; Firecrawl; HTML",
        "featured": false,
        "coverAlt": "Rendered sample blog post produced by the pipeline",
        "metrics": [
          {"value":"10","label":"sources searched per topic by default"},
          {"value":"5","label":"top sources scraped to full text"},
          {"value":"1","label":"shareable HTML post per run"}
        ]
      }
    ]
  },
  "caseStudies": [
    {
      "slug": "joshua-os",
      "title": "Joshua-OS",
      "status": "In production",
      "period": "Aug 2026 to present",
      "role": "Sole designer and operator",
      "stack": "Claude Code; Markdown agents and skills; Bash; PowerShell; Python; TypeScript; GitHub Actions; gitleaks",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "I run several live projects alone: a field app, a reporting platform and paper-trading labs. Agents without a system produce a pile of prompts, so I needed one place that plans, builds, verifies and remembers. Plans and builds run in separate sessions. Parallel agents each get their own worktree so they never touch the same files. Every finished task is ticked in a todo the moment it is verified. Joshua-OS is that layer, in one git repo.",
      "built": [
        "Wrote the SOP every project follows: coordinate, plan, build, verify, ship, learn. Every plan names the outcome it serves.",
        "Wrote 9 global rule files: TDD with 80% coverage, pass^k for critical paths, Telegram input treated as untrusted.",
        "Built worktree.sh: each builder agent gets its own git worktree; merges refuse dirty overlaps and snapshot main to a backup ref first.",
        "Assembled and operate 66 subagents, 90 skills and 14 commands, many from plugins, each agent with its own model and tool list.",
        "Built a Claude Code mod: an /app-status pane and status line parsed from a project's todo file, with tests.",
        "Built research pipelines and knowledge tooling: a multi-agent research skill with source checks, and a command-center snapshot of every project's status."
      ],
      "architecture": "AGENTS.md and 9 rule files load into every session. The SOP runs left to right: coordinate, plan, build, verify, ship, learn. Build fans out into parallel worktree lanes, one builder agent each, merging to main behind a backup ref. Verify routes to reviewer agents. Learn writes to lessons and memory. Each project keeps one todo file.",
      "evidence": [
        {"file":"cover.webp","caption":"Agent roster table: each subagent's role and model tier."},
        {"file":"01.webp","caption":"The skill library folder list beside the worktree-lanes skill's front matter."},
        {"file":"02.webp","caption":"Terminal: worktree.sh creating a lane, listing lanes, then merging one back."},
        {"file":"03.webp","caption":"git log graph with merge(wt) commits from parallel lanes."},
        {"file":"04.webp","caption":"Bar chart of commits per day, August to October 2026."},
        {"file":"05.webp","caption":"The /app-status pane and status line, project names removed."},
        {"file":"walkthrough.gif","caption":"One worktree lane from creation to merge into main, recorded in the terminal."}
      ],
      "results": [
        {"value":"190","label":"commits since Aug 19, 2026"},
        {"value":"27","label":"worktree-lane merges into main"},
        {"value":"66 / 90 / 14","label":"agents, skills and commands operated; many from plugins"}
      ],
      "next": "Publish a sanitized showcase repo of my rules, scripts and mod, with third-party agents and skills credited or removed. Then add a scored eval suite for the agents themselves."
    },
    {
      "slug": "jacobs-reporting-platform",
      "title": "Jacobs reporting and compliance platform",
      "status": "In production",
      "period": "2026 to present",
      "role": "Self-initiated; sole designer and developer",
      "stack": "Python 3.11; openpyxl; FastAPI; pydantic; vanilla JavaScript; hand-written SVG charts; Windows batch; Node test scripts",
      "links": {"repo":null,"demo":"/demo/jacobs-platform"},
      "demoNote": "Synthetic data. Structure identical to production. Reporting views only; every name, date and cost is fake.",
      "problem": "The project's reporting was assembled by hand each cycle. Cost reports, Primavera P6 schedule exports and five compliance and commercial trackers lived in separate workbooks. Compliance was a periodic manual spreadsheet review. Project machines are locked down, so nothing could be installed. I built one console where every number traces to a source cell, refreshed with one click.",
      "built": [
        "A 2,409-line Python ETL in five files that turns cost, schedule, safety and quality workbooks into JSON.",
        "Content-fingerprint discovery: the ETL finds each workbook by what it contains and maps columns by header name, not position.",
        "Ported a 9,000-line React and FastAPI workforce app into the static dashboard; a 315-line script runs its FastAPI readers in-process.",
        "A zero-install front end: 1 HTML file, 6 CSS, 19 JS, hand-written SVG charts, 26 hash-routed views.",
        "Missing sheets degrade to empty sections, and absent fields show as unavailable, never zero. A test renders both P6 export shapes.",
        "Keyboard-navigable dialogs with focus return, audited against WCAG AA."
      ],
      "architecture": "Ten source workbook roles sit on the left: cost report, 6-column P6 export, milestones, five workforce trackers, safety log, quality log. They flow through three paths: the reports ETL, the safety and quality extractors, and the FastAPI readers run in-process. All write JSON, baked into JS data files. One static HTML page renders 26 views.",
      "evidence": [
        {"file":"cover.webp","caption":"Command Center view on synthetic data."},
        {"file":"01.webp","caption":"Budget and Cost view: forecast bridge, dials and category coverage, synthetic data."},
        {"file":"02.webp","caption":"Schedule view: milestone waterfall and look-ahead, synthetic data."},
        {"file":"03.webp","caption":"Safety Observation summary, synthetic data."},
        {"file":"04.webp","caption":"Schedule view at phone width, where rows become a list."},
        {"file":"05.webp","caption":"Command Center in light and dark theme."},
        {"file":"walkthrough.gif","caption":"Clicking through the reporting views by hash route, synthetic data."}
      ],
      "results": [
        {"value":"26","label":"hash-routed views: 6 reports, 17 workforce, 1 safety, 2 quality"},
        {"value":"2,409","label":"lines of Python ETL"},
        {"value":"0","label":"installs to open it: 1 HTML, 6 CSS, 19 JS files, no CDN"}
      ],
      "next": "Move this data out of spreadsheets: the field app puts it in Postgres with row-level security. Add CI to this repo, since deploys today are scripted but not tested in a pipeline."
    },
    {
      "slug": "jevtrade",
      "title": "JevTrade",
      "status": "Paper / sandbox",
      "period": "Oct 8 to 13, 2026, a five-day sprint",
      "role": "Sole owner; built with Claude Code subagents in parallel worktree lanes",
      "stack": "Python 3.12; pytest; ruff; uv; Alpaca paper API; TypeSafe Jev API; Telegram (send-only); Windows Task Scheduler",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "The project started from a third-party trading-bot blueprint. Before any strategy used a model, I wanted to measure whether a commercial typed-judgment model (Jev, by TypeSafe) calls BTC direction or regime better than trivial baselines. I fixed the pass bar in advance, sealed a holdout, and built a lab to score it. Paper account only. The answer was no.",
      "built": [
        "A stdlib-only Python lab: hourly BTC bars since 2021 with a sha256 manifest, and a backtest engine with fees and slippage.",
        "Honesty harness: last 6 months sealed, one shot per strategy, walk-forward with purge, deflated Sharpe, and an auto-logged attempt notebook.",
        "A replay scorer: 17,517 hourly snapshots anonymised to percentages, answers cached by battery hash, block bootstrap with 10,000 resamples.",
        "AST boundary tests: the lab never imports order code, and the scorer never reads the vault. Look-ahead tests guard both.",
        "1,275 tests passing; lab and scorer modules at 100% line and branch coverage, as recorded in the project todo.",
        "Code and security review agents reviewed the scoring build: 0 critical findings. Verdict on 2026-10-12: model closed for strategies."
      ],
      "architecture": "A cached market-data store feeds two packages. The lab runs strategies through walk-forward, purge and the sealed vault. The jevtest package builds anonymised snapshots, asks Jev typed questions, caches the answers, and scores them against baselines with bootstrap confidence intervals. AST-checked walls separate both from the paper-order code. Results land in an append-only notebook.",
      "evidence": [
        {"file":"cover.webp","caption":"Direction scorer output: hit rate and 95% CI against two baselines."},
        {"file":"01.webp","caption":"Pre-registration excerpt: the regime test's Brier gates, committed before scoring."},
        {"file":"02.webp","caption":"Attempt notebook lines: each strategy's declared edge and deflated Sharpe."},
        {"file":"03.webp","caption":"Test run summary in the terminal."},
        {"file":"walkthrough.gif","caption":"Scoring a cached replay in the terminal, ending on the verdict line."}
      ],
      "results": [
        {"value":"47.3%","label":"direction hit rate (95% CI 46.4-48.3) vs 50.9% for always up"},
        {"value":"0.848","label":"regime Brier score vs 0.466 for the base rate; lower is better"},
        {"value":"17,005","label":"scored calls, 0 errors"}
      ],
      "next": "Run the coin-pick test that is pre-registered and frozen but not yet run. Replace the vendor client with a model-agnostic judge interface and publish the harness."
    },
    {
      "slug": "jacobs-field-app",
      "title": "Jacobs field app",
      "status": "In progress",
      "period": "Sep 2026 to present",
      "role": "Product owner and lead engineer; built card by card with Claude Code subagents and independent reviewer agents",
      "stack": "Expo 57; React Native 0.86; React 19; TypeScript; Supabase Postgres; TanStack Query; zod; i18next; Jest; Playwright with axe; pgTAP; GitHub Actions",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "The reporting platform still runs on spreadsheets. The field app moves the project's data into one Postgres database and shows exceptions first. Every number shows its source, as-of date and coverage. Many field staff work in Spanish, so both languages ship together. Version 1 reads imported data. Later stages replace spreadsheets with forms. Stage 1 is done; the app is pre-pilot.",
      "built": [
        "One TypeScript codebase for iOS, Android and web on Expo 57 and React Native 0.86: 9 screens.",
        "Supabase Postgres with 12 tables, row-level security on every one, 25 policies, and writes only through the service role.",
        "MFA enforced at the database (aal2), sessions in secure storage, default grants revoked for anon and authenticated roles.",
        "Spanish and English with 173 keys each; a CI test fails the build if the two drift.",
        "An importer CLI with a fidelity oracle that recounts app data against the source: 23 of 23 checks matched.",
        "CI on GitHub Actions: typecheck, lint, Jest, pgTAP, Playwright with axe, and gitleaks, actions pinned to SHAs."
      ],
      "architecture": "Dashboard exports feed a TypeScript importer CLI with a fidelity oracle. It writes to Supabase Postgres through the service role. The Expo app signs in with MFA, then reads through supabase-js under row-level security, with realtime refresh. CI wraps the repo: typecheck, lint, unit tests, pgTAP, end-to-end tests and a secret scan.",
      "evidence": [
        {"file":"cover.webp","caption":"Design-system gallery at desktop width, light theme."},
        {"file":"01.webp","caption":"The same gallery in dark theme."},
        {"file":"02.webp","caption":"Sign-in screen in English and Spanish, side by side."},
        {"file":"03.webp","caption":"MFA challenge screen."},
        {"file":"04.webp","caption":"Design-system gallery at phone width."},
        {"file":"walkthrough.gif","caption":"Sign-in to MFA on the web build against a local database."}
      ],
      "results": [
        {"value":"12","label":"tables, row-level security on all, 25 policies"},
        {"value":"173","label":"keys per language, parity-tested in CI"},
        {"value":"461 / 316 / 21","label":"Jest, database and end-to-end tests, as recorded in the project todo"}
      ],
      "next": "Stage 2 adds job hazard analysis and quality logs: 27 cards, architect-reviewed, awaiting approval. The finish line is a demo on iPhone and Android."
    },
    {
      "slug": "megateam",
      "title": "MegaTeam",
      "status": "Paper / sandbox",
      "period": "Oct 2026 to present",
      "role": "Sole owner; built with Claude Code subagents in parallel worktree lanes",
      "stack": "Python 3.11; FastAPI; pydantic; SQLite; TypeSafe Jev API; Telegram Bot API; Windows Task Scheduler",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "A third-party guide described a memecoin desk run by AI judges. I wanted to see what it would do with real new listings before any money went in, so the desk runs in shadow mode. It scans, judges and logs what it would buy, and a paper ledger scores each would-be trade. Its first paper trade lost 93.9%. The ledger recorded the loss, which is its job.",
      "built": [
        "A funnel across three chains: new pools from GeckoTerminal, free filters, dossiers, a Jev judge, then a pick made in code.",
        "The judge runs as its own loopback FastAPI service, holding the only API key, behind a constant-time shared secret.",
        "Shadow mode enforced in code: any other mode refuses to start, and no order path exists. An empty STOP file kills it.",
        "A paper ledger with fees, 1% slippage and a 6% Kelly cap. Its own Telegram bot sends alerts and a daily summary.",
        "Runs under Windows Task Scheduler: a scan every 15 minutes, a risk check every 5. 646 tests, as recorded.",
        "Related work: Trading Desk, six read-only Claude Code subagents where a risk manager holds a veto and a human decides."
      ],
      "architecture": "New listings flow left to right: collect, free cut, trade cut, dossier, Jev judge, soft cut, pick. Code fetches and decides; the model only judges the uncertain step. Picks go to a shadow log and a paper ledger, then to Telegram.",
      "evidence": [
        {"file":"cover.webp","caption":"The funnel table from the project README."},
        {"file":"01.webp","caption":"One scan-cycle log line: tokens seen, benched, judged, no order."},
        {"file":"02.webp","caption":"A desk alert in Telegram, cropped to ticker and percent."},
        {"file":"03.webp","caption":"Task Scheduler window showing the shadow job."}
      ],
      "results": [
        {"value":"59","label":"shadow scan cycles, 325 Jev calls, 1 would-be order"},
        {"value":"-93.9%","label":"paper trade #1, closed by the volume-decay rule"},
        {"value":"646","label":"tests, ruff clean, as recorded in the project todo"}
      ],
      "next": "Finish the shadow week. Then judge it against the bar fixed in advance: at least 10 closed paper trades and positive net return after fees."
    },
    {
      "slug": "btc-paper-bot",
      "title": "BTC 5-minute paper bot",
      "status": "Paper / sandbox",
      "period": "Oct 2026 to present",
      "role": "Sole owner; built with Claude Code",
      "stack": "Node 22; ES modules; node --test; Claude CLI; Binance public API; CSV and JSONL",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "A trading guide claimed large profits from a 5-minute BTC bot. My audit of that bot found +$97.9k, not the claimed +$279k, and it bought both sides. So I tested whether Claude can call 5-minute BTC moves. Every call is logged. Bets happen only when rules in code allow, at a fake $5 stake.",
      "built": [
        "A Node 22 runner with no runtime dependencies: every 5 minutes it fetches BTC from Binance and asks the Claude CLI.",
        "Claude runs as a child process with no shell and a cleaned environment. Invalid JSON throws instead of guessing.",
        "The bet rule lives in code: confidence 7 or higher, last 5-minute move 0.3% or less, no open bet.",
        "No wallet or order code, guarded by a test. A STOP-file kill switch, a single-instance lock, an append-only ledger.",
        "A review file reports win rate, the 51.75% after-fee break-even, and a binomial p-value with a luck warning."
      ],
      "architecture": "Every 5 minutes the runner checks the kill switch, settles finished rounds and fetches 15 minutes of BTC. Then it asks Claude and applies the bet rule in code. Last, it appends to the ledger and rebuilds the CSV sheet and review.",
      "evidence": [
        {"file":"cover.webp","caption":"The runner window, one line per 5-minute cycle."},
        {"file":"01.webp","caption":"The review file, including its \"Honesty about luck\" section."},
        {"file":"02.webp","caption":"Test run summary and the header of the safety test."}
      ],
      "results": [
        {"value":"186","label":"Claude calls logged"},
        {"value":"0","label":"bets so far: 180 calls fell below confidence 7"},
        {"value":"218","label":"tests, 97.75% line coverage, as recorded in the project todo"}
      ],
      "next": "Keep it running to 100 settled bets, when the review gives its first verdict. No win rate exists until then."
    },
    {
      "slug": "tulip-mes",
      "title": "Tulip MES apps",
      "status": "Shipped",
      "period": "Dec 2025 to Mar 2026",
      "role": "Application Developer and Validation Engineer, Validation Resource Group",
      "stack": "Tulip; Jira",
      "links": {"repo":null,"demo":null},
      "demoNote": "",
      "problem": "A medical device manufacturing client in Cayey, Puerto Rico ran shop-floor processes, inspection logs and electronic batch records on paper. The work was to replace them with digital production flows that enforce the protocol step by step.",
      "built": [
        "Designed, developed and validated Tulip apps replacing paper shop-floor processes, inspection logs and electronic batch record workflows.",
        "Integrated batch tracking, equipment data capture and protocol enforcement into digital production flows.",
        "Converted manufacturing SOPs and validation protocols into structured, step-driven apps.",
        "Built input validation, conditional logic and audit trail capture to enforce compliance and reduce documentation errors.",
        "Supported system testing, UAT and change tracking in Jira ahead of production release."
      ],
      "architecture": "An SOP or validation protocol becomes a step-driven app. Operators capture batch and equipment data step by step. Input validation and conditional logic block bad entries. Each action writes to an audit trail. System testing and UAT run before release, with changes tracked in Jira.",
      "evidence": [{"file":"cover.webp","caption":"Typographic cover card. Client screens stay private."}],
      "results": [
        {"value":"2","label":"Tulip developer certifications, Basic and Advanced, Dec 2025"},
        {"value":"UAT","label":"supported before production release"},
        {"value":"Audit trail","label":"capture built into the apps"}
      ],
      "next": "The client and its apps stay private. With approval, I would publish a sanitized walkthrough of one step-driven app."
    },
    {
      "slug": "blog-poster",
      "title": "blog-poster",
      "status": "Shipped",
      "period": "Jun 2026",
      "role": "Sole owner; built with Claude Code",
      "stack": "Python; Exa; Firecrawl; HTML",
      "links": {"repo":"https://github.com/Joshua7792/blog-poster","demo":null},
      "demoNote": "",
      "problem": "I wanted blog posts about applied AI grounded in real sources and case studies, not in a model's memory. The pipeline takes a topic, finds sources, scrapes their full text, and drafts from what they say.",
      "built": [
        "A Workflows, Agents, Tools structure: Markdown workflows define the steps, small Python tools do the deterministic work.",
        "search_sources.py queries Exa for applied sources: 10 results by default, plus optional seed URLs.",
        "scrape_sources.py pulls the full text of the top 5 through Firecrawl.",
        "render_post.py turns the draft into a shareable HTML page; each run also writes a learning-log entry.",
        "API keys stay in .env, ignored by git. The public repo ships only .env.example."
      ],
      "architecture": "Topic in. Exa searches, Firecrawl scrapes the top sources, and the draft is grounded in the scraped text. Out come an HTML post and a log entry.",
      "evidence": [
        {"file":"cover.webp","caption":"A rendered sample post from the pipeline."},
        {"file":"01.webp","caption":"The workflow blueprint page from the repo's docs folder."},
        {"file":"02.webp","caption":"The repo's file tree on GitHub."}
      ],
      "results": [
        {"value":"10","label":"sources searched per topic by default"},
        {"value":"5","label":"top sources scraped to full text"},
        {"value":"1","label":"shareable HTML post per run"}
      ],
      "next": "Add a README and a sample-output page. Then add a check that every claim in a draft maps to a scraped source."
    }
  ],
  "experience": {
    "heading": "Experience",
    "entries": [
      {
        "company": "Jacobs, Life Sciences Americas",
        "role": "Construction Coordinator / AI Developer / IT",
        "period": "Apr 2026 to present",
        "location": "Guaynabo, Puerto Rico",
        "bullets": [
          "Coordinate construction delivery and HSE compliance for a large capital construction program.",
          "Designed and built the project's reporting and compliance platform, which the team adopted as its working reporting.",
          "The only technical person in the office: I build the dashboards, reports, workflows and app, and fix IT when it breaks."
        ]
      },
      {
        "company": "Validation Resource Group",
        "role": "Application Developer and Validation Engineer",
        "period": "Dec 2025 to Mar 2026",
        "location": "Cayey, Puerto Rico (medical device manufacturing client)",
        "bullets": [
          "Designed, developed and validated Tulip MES apps replacing paper shop-floor processes and electronic batch record workflows.",
          "Built input validation, conditional logic and audit trail capture to enforce compliance.",
          "Supported system testing, UAT and change tracking in Jira ahead of production release."
        ]
      },
      {
        "company": "Alpine Health Technology",
        "role": "Back End Developer I",
        "period": "Jun 2025 to Aug 2025",
        "location": "Guaynabo, Puerto Rico",
        "bullets": [
          "Developed and optimized SQL queries across health plan applications.",
          "Configured secure data storage and backups to meet HIPAA requirements.",
          "Supported deployment automation and version control through CI/CD in Azure DevOps."
        ]
      },
      {
        "company": "Granicus",
        "role": "Software Engineer",
        "period": "May 2024 to Dec 2024",
        "location": "San Juan, Puerto Rico",
        "bullets": [
          "Built and maintained full stack web apps across .NET and Java back ends for public sector case management.",
          "Implemented CI/CD pipelines in Azure DevOps and GitHub Actions for ASP.NET applications.",
          "Wrote technical documentation, user guides and API documentation."
        ]
      },
      {
        "company": "Granicus",
        "role": "Software Engineer Intern",
        "period": "Oct 2023 to Apr 2024",
        "location": "San Juan, Puerto Rico",
        "bullets": [
          "Supported full stack application maintenance in C#, SQL and JavaScript.",
          "Improved CI/CD deployment quality through code review and automated testing."
        ]
      }
    ]
  },
  "education": {
    "heading": "Education",
    "entries": [
      {
        "school": "Peru State College",
        "credential": "Bachelor of Science, triple major in Computer Information Systems, Accounting, and Business Administration",
        "period": "2017 to 2022",
        "line": ""
      },
      {
        "school": "Holberton Coding School, San Juan, Puerto Rico",
        "credential": "Software Engineering, 9 Month Certificate Program",
        "period": "Jun 2023 to Mar 2024",
        "line": "Capstone: HealHub, a health management web app built with Node.js, Python, Django, PostgreSQL and AWS."
      }
    ]
  },
  "certifications": {
    "heading": "Certifications",
    "items": [
      "Microsoft Certified: Azure Developer Associate (AZ-204), June 2024",
      "Tulip Advanced Developer Certification, Dec 2025",
      "Tulip Basic Developer Certification, Dec 2025",
      "Cybersecurity Certification (Holberton), Mar 2024"
    ]
  },
  "cta": {
    "heading": "The full record is in the resume.",
    "body": "Dates, certifications and contact details are in the PDF. The case studies above are the long version.",
    "buttonLabel": "Download Resume",
    "note": "PDF, contact details inside"
  },
  "footer": {
    "giantWord": "Joshua / Santiago (two lines, mixed case; see design-spec §6.15 and §14.2)",
    "line": "© 2026 Joshua Santiago, built with Next.js",
    "links": [
      {"label":"GitHub","href":"https://github.com/Joshua7792"},
      {"label":"LinkedIn","href":"https://www.linkedin.com/in/joshua-santiago00"},
      {"label":"Resume","href":"/resume/joshua-santiago-resume.pdf"}
    ]
  },
  "alsoBuilt": {
    "heading": "Also built",
    "items": [
      {
        "title": "Trading Desk",
        "description": "six read-only Claude Code subagents run a paper trading desk; a risk manager holds a veto and a human decides.",
        "href": null
      },
      {
        "title": "Research pipeline",
        "description": "I operate a multi-agent research skill. Five expert agents run in parallel, then a contradiction map and source verification. Third-party skill, run by me.",
        "href": null
      },
      {
        "title": "Command center",
        "description": "a stdlib Python snapshot that reads every project's status block and lessons into one dashboard.",
        "href": null
      },
      {"title":"Holberton coursework in C, Python and JavaScript, 2023 to 2025.","description":"","href":"https://github.com/Joshua7792"}
    ]
  }
}
);
