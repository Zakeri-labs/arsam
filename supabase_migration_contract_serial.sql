-- Contract numbers (CNT-YYYY-NNNN) come from a counter in the database, so two reservations saved at the
-- same moment can never get the same number, and a number is never reused after a contract is deleted
-- (a customer link sent for a deleted contract can then never open someone else's contract). Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS public.contract_serials (
  year integer PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);
ALTER TABLE public.contract_serials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contract_serials FROM anon, authenticated;

-- Start each year after the highest number already used
INSERT INTO public.contract_serials (year, last_value)
SELECT substring(id from 5 for 4)::int, max(substring(id from 10)::int)
FROM public.car_contracts
WHERE id ~ '^CNT-[0-9]{4}-[0-9]+$'
GROUP BY 1
ON CONFLICT (year) DO UPDATE SET last_value = GREATEST(public.contract_serials.last_value, EXCLUDED.last_value);

CREATE OR REPLACE FUNCTION public.next_contract_serial(p_year integer)
RETURNS integer LANGUAGE sql AS $$
  INSERT INTO public.contract_serials (year, last_value) VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_value = public.contract_serials.last_value + 1
  RETURNING last_value;
$$;
REVOKE EXECUTE ON FUNCTION public.next_contract_serial(integer) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_contract_serial(integer) TO service_role;

-- One contract per reservation, enforced by the database
CREATE UNIQUE INDEX IF NOT EXISTS uq_car_contracts_reservation ON public.car_contracts(reservation_id) WHERE reservation_id IS NOT NULL;

COMMIT;
