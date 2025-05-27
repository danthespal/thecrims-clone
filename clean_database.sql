-- Clean Startup PostgreSQL Dump

-- Drop existing tables (optional safety for dev resets)
DROP TABLE IF EXISTS public."CasinoTransactions" CASCADE;
DROP TABLE IF EXISTS public."CasinoWallet" CASCADE;
DROP TABLE IF EXISTS public."ClubMessages" CASCADE;
DROP TABLE IF EXISTS public."GameSettings" CASCADE;
DROP TABLE IF EXISTS public."Items" CASCADE;
DROP TABLE IF EXISTS public."PrivateMessages" CASCADE;
DROP TABLE IF EXISTS public."Sessions" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."UserCooldowns" CASCADE;
DROP TABLE IF EXISTS public."UserEquipment" CASCADE;
DROP TABLE IF EXISTS public."UserInventory" CASCADE;

-- Sequences
CREATE SEQUENCE public."CasinoTransactions_id_seq" START 1;
CREATE SEQUENCE public."ClubMessages_id_seq" START 1;
CREATE SEQUENCE public."PrivateMessages_id_seq" START 1;
CREATE SEQUENCE public."User_id_seq" START 1;

-- Tables
CREATE TABLE public."User" (
    id integer PRIMARY KEY DEFAULT nextval('public."User_id_seq"'),
    account_name text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    profile_name text NOT NULL,
    profile_suffix text NOT NULL,
    date_of_birth date NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    money integer DEFAULT 0 NOT NULL,
    respect integer DEFAULT 0 NOT NULL,
    will integer DEFAULT 100 NOT NULL,
    last_regen timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."Sessions" (
    id uuid PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."GameSettings" (
    key text PRIMARY KEY,
    value text NOT NULL
);

CREATE TABLE public."Items" (
    id integer PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    price integer DEFAULT 0 NOT NULL,
    will_restore integer DEFAULT 0 NOT NULL
);

CREATE TABLE public."CasinoWallet" (
    user_id integer PRIMARY KEY REFERENCES public."User"(id) ON DELETE CASCADE,
    balance integer DEFAULT 0 NOT NULL
);

CREATE TABLE public."CasinoTransactions" (
    id integer PRIMARY KEY DEFAULT nextval('public."CasinoTransactions_id_seq"'),
    user_id integer NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    amount integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."UserCooldowns" (
    user_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    action text NOT NULL,
    last_used timestamp NOT NULL,
    PRIMARY KEY (user_id, action)
);

CREATE TABLE public."UserInventory" (
    user_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    item_id integer REFERENCES public."Items"(id),
    quantity integer DEFAULT 1 NOT NULL,
    PRIMARY KEY (user_id, item_id)
);

CREATE TABLE public."UserEquipment" (
    user_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    slot text NOT NULL,
    item_id integer REFERENCES public."Items"(id),
    PRIMARY KEY (user_id, slot)
);

CREATE TABLE public."ClubMessages" (
    id bigint PRIMARY KEY DEFAULT nextval('public."ClubMessages_id_seq"'),
    user_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public."PrivateMessages" (
    id bigint PRIMARY KEY DEFAULT nextval('public."PrivateMessages_id_seq"'),
    sender_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    recipient_id integer REFERENCES public."User"(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON public."Sessions"(user_id);
CREATE INDEX idx_user_account_name ON public."User"(account_name);
CREATE INDEX idx_user_email ON public."User"(email);
CREATE INDEX idx_user_profile_name ON public."User"(profile_name);

-- Seed: GameSettings
INSERT INTO public."GameSettings" (key, value) VALUES
('max_will', '100'),
('will_regen_per_minute', '1');

-- Seed: Items
INSERT INTO public."Items" (id, name, description, type, created_at, price, will_restore) VALUES
(1, 'Knight Helmet', 'Heavy iron helmet.', 'helmet', CURRENT_TIMESTAMP, 100, 0),
(2, 'Steel Armor', 'Solid protection for the chest.', 'armor', CURRENT_TIMESTAMP, 150, 0),
(3, 'Leather Boots', 'Flexible and sturdy.', 'boots', CURRENT_TIMESTAMP, 80, 0),
(4, 'Golden Amulet', 'Boosts magic resistance.', 'amulet', CURRENT_TIMESTAMP, 200, 0),
(5, 'Silver Ring', 'A shiny ring.', 'ring', CURRENT_TIMESTAMP, 120, 0),
(6, 'Short Sword', 'A quick, light weapon.', 'weapon', CURRENT_TIMESTAMP, 180, 0),
(7, 'Wool Gloves', 'Warm and comfortable.', 'gloves', CURRENT_TIMESTAMP, 60, 0),
(100, 'Weed', 'A small joint. Restores a bit of will.', 'drug', CURRENT_TIMESTAMP, 50, 10),
(101, 'Cocaine', 'Instant energy boost. Restores a lot of will.', 'drug', CURRENT_TIMESTAMP, 200, 40),
(102, 'LSD', 'Unlocks your mind. Medium will restore.', 'drug', CURRENT_TIMESTAMP, 120, 25),
(103, 'Ecstasy', 'Feel amazing. High temporary boost.', 'drug', CURRENT_TIMESTAMP, 180, 35);
