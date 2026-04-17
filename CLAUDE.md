# CLAUDE.md – Yield Subscriptions

## Co to jest

Protokół subskrypcji na-chain oparty o Solana/Anchor. Użytkownicy wpłacają depozyt SPL-tokenów i płacą cykliczne opłaty merchantowi; protokół generuje "yield" na depozycie (obliczany wzorem prostym, nie via zewnętrzny protokół DeFi), który pokrywa opłaty zamiast uszczuplać główkę. Projekt pisany na hackathon Solana.

Program ID (localnet): `FZsK8dcZbeGEsm4fw45LWssEgYkTkxEPQ5YoMtWdhS61`

---

## Struktura repozytorium

```
yield-subscriptions/
├── programs/yield-subscriptions/src/   # Program Anchor (Rust)
│   ├── lib.rs                          # Punkt wejścia, deklaracja instrukcji
│   ├── state.rs                        # Typy kont (GlobalConfig, MerchantPlan, UserSubscription)
│   ├── constants.rs                    # Seedy PDA + SECONDS_PER_YEAR
│   ├── errors.rs                       # ErrorCode enum
│   ├── events.rs                       # Eventy (PlanCreated, Subscribed, Settled, Canceled)
│   └── instructions/
│       ├── mod.rs
│       ├── initialize_config.rs        # Jednorazowa inicjalizacja protokołu
│       ├── create_plan.rs              # Merchant tworzy plan subskrypcji
│       ├── subscribe.rs                # User wpłaca depozyt i tworzy subskrypcję
│       ├── settle.rs                   # Dowolny caller rozlicza należne okresy
│       └── cancel.rs                   # User anuluje, najpierw rozlicza należne, potem zwraca resztę
├── tests/
│   └── yield-subscriptions.ts          # Testy integracyjne (Mocha/Chai via anchor test)
├── app/                                # Frontend (Vite + React + TailwindCSS v4)
│   └── src/
│       ├── components/
│       │   ├── LandingPage.tsx
│       │   ├── MerchantView.tsx        # UI dla merchantów
│       │   ├── UserView.tsx            # UI dla użytkowników
│       │   └── Console.tsx
│       ├── hooks/                      # Custom React hooks
│       ├── lib/                        # Helpery (np. klient anchor)
│       └── types/
├── Anchor.toml                         # Konfiguracja Anchor (localnet, package_manager: yarn)
├── Cargo.toml                          # Workspace Rust
├── rust-toolchain.toml                 # Rust 1.89.0
└── package.json                        # Root: anchor SDKs, spl-token, testrunner
```

---

## Konta on-chain (state.rs)

### `GlobalConfig` – PDA `["config"]`
| Pole | Typ | Opis |
|------|-----|------|
| `admin` | Pubkey | Administrator protokołu |
| `annual_yield_bps` | u16 | Roczny yield w punktach bazowych (np. 1000 = 10%) |
| `protocol_fee_bps` | u16 | Opłata protokołu w bps |
| `bump` | u8 | PDA bump |

### `MerchantPlan` – PDA `["plan", merchant]`
| Pole | Typ | Opis |
|------|-----|------|
| `merchant` | Pubkey | Właściciel planu |
| `token_mint` | Pubkey | Mint SPL przyjmowany w planie |
| `price_per_period` | u64 | Cena za jeden okres (w atomach tokena) |
| `period_seconds` | i64 | Długość jednego okresu w sekundach |
| `min_deposit` | u64 | Minimalny depozyt startowy |
| `vault` | Pubkey | Adres PDA vault |
| `bump` / `vault_bump` | u8 | Bumpy PDA |

Vault tokenów: PDA `["vault", merchant_plan]`, authority = `MerchantPlan`.

### `UserSubscription` – PDA `["sub", merchant_plan, user]`
| Pole | Typ | Opis |
|------|-----|------|
| `user` | Pubkey | Subscriber |
| `plan` | Pubkey | MerchantPlan do którego należy |
| `principal_deposit` | u64 | Pierwotny depozyt |
| `principal_remaining` | u64 | Pozostały depozyt (spada gdy yield nie pokrywa opłat) |
| `last_settlement_timestamp` | i64 | Unix timestamp ostatniego rozliczenia |
| `status` | u8 | 0 = Active, 1 = Canceled |
| `bump` | u8 | PDA bump |

---

## Instrukcje

### `initialize_config(admin, annual_yield_bps, protocol_fee_bps)`
Tworzy singleton `GlobalConfig`. Wywołuje dowolny payer; jednorazowe.

### `create_plan(price_per_period, period_seconds, min_deposit)`
Merchant tworzy `MerchantPlan` i vault TokenAccount. Wymaga signer: **merchant**.

### `subscribe(initial_deposit)`
User wpłaca tokeny do vault i tworzy `UserSubscription`. Wymaga signer: **user**.
Sprawdza: `initial_deposit >= min_deposit`.

### `settle()`
Permissionless (każdy może wywołać). Oblicza ile okresów minęło, liczy yield, debituje opłaty. Transfer z vault do merchant ATA przez CPI z signer PDA `["plan", merchant]`.

**Formuła yield:**
```
yield = principal_remaining * annual_yield_bps * elapsed_seconds / 10_000 / 31_536_000
paid_from_yield = min(yield, amount_due)
shortfall = amount_due - paid_from_yield   # pokrywany z principal_remaining
```
Jeśli `principal_remaining` spada do 0 → status Canceled.

### `cancel()`
Wywołuje **user** (signer). Wewnętrznie najpierw wykonuje logikę `settle` dla narosłych okresów, następnie zwraca resztę `principal_remaining` do user ATA. Status → Canceled.

---

## Seedy PDA (constants.rs)

```rust
SEEDS_CONFIG = b"config"
SEEDS_PLAN   = b"plan"
SEEDS_SUB    = b"sub"
SEEDS_VAULT  = b"vault"
```

---

## Commands

### Budowanie programu
```bash
anchor build
```

### Uruchomienie testów integracyjnych
```bash
anchor test
```
Uruchamia lokalny validator, deployuje program, odpala testy Mocha z `tests/yield-subscriptions.ts`.

### Frontend dev server
```bash
cd app
npm run dev
```
Domyślnie Vite na `http://localhost:5173`.

### Linting (root)
```bash
yarn lint
yarn lint:fix
```

---

## Stack

| Warstwa | Technologia |
|---------|------------|
| Program | Rust + Anchor 0.32.x |
| Rust toolchain | 1.89.0 (nightly dla anchor) |
| Testy programu | TypeScript + Mocha/Chai + `@coral-xyz/anchor` 0.32.1 |
| Frontend | Vite + React + TypeScript + TailwindCSS v4 |
| Wallet | `@solana/wallet-adapter-*` |
| SPL Token | `@solana/spl-token` 0.4.x |
| Package manager | **yarn** (root), **npm** (app/) |

---

## Znane kwestie i pułapki

- **`Cargo.lock` v4** – Rust 1.89.0 generuje lockfile w wersji 4, której starsze wersje cargo (bundlowane ze starszym Anchorem) nie parsują. Upewnij się że używasz zgodnej wersji Anchor CLI.
- **Vault authority** – vault jest autoryzowany przez `MerchantPlan` PDA, nie przez merchant keypair. CPI do token transfer w `settle`/`cancel` używa `new_with_signer` z seedami `["plan", merchant]`.
- **`settle` jest permissionless** – nie ma dereference na `Signer` dla wywołującego settle; to ważne, bo cron/keeper może to wywoływać.
- **Cancel zawiera częściowe settle** – przy cancel najpierw rozlicza narosłe okresy, potem zwraca resztę. Upewnij się że w teście jest wystarczający czas lub `principal_remaining` po settle jest > 0.
- **`has_one = plan`** – constraint w `Cancel` sprawdza `user_subscription.plan == plan.key()`, więc konto `plan` musi być tym samym co przy subskrypcji.
- **Brak `require_keys_eq!(sub.user, user)` w `settle`** – settle nie weryfikuje callera, tylko stan subskrypcji.

---

## Eventy

| Event | Emitowany w | Pola |
|-------|------------|------|
| `PlanCreated` | `create_plan` | merchant, plan, price_per_period, period_seconds |
| `Subscribed` | `subscribe` | user, plan, initial_deposit |
| `Settled` | `settle` | user, plan, amount_paid, yield_used, principal_used, remaining_principal |
| `Canceled` | `cancel` | user, plan |
