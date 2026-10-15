\set ON_ERROR_STOP on
-- A temporary GitHub Actions PostgreSQL instance only. Never use a production URL.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.consultations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id text UNIQUE NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 items jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
INSERT INTO public.consultations(request_id,items)
VALUES('AC-20261015-AAAA0001','[]'::jsonb);
COMMIT;
\ir ../supabase/sql/intake-email-outbox.sql
BEGIN;
DO $$
DECLARE
 a uuid; b uuid; t uuid; batch_size int;
BEGIN
 SELECT count(*) INTO batch_size FROM public.intake_email_outbox;
 IF batch_size<>0 THEN RAISE EXCEPTION 'Existing rows backfilled unexpectedly'; END IF;
 INSERT INTO public.consultations(request_id,items)
 VALUES ('AC-20261015-AAAA0002','[{},{}]'::jsonb) RETURNING id INTO a;
 SELECT count(*) INTO batch_size FROM public.intake_email_outbox WHERE intake_id=a;
 IF batch_size<>1 THEN RAISE EXCEPTION 'Outbox trigger expected one row, got %',batch_size;END IF;
 SELECT product_count INTO batch_size FROM public.intake_email_outbox WHERE intake_id=a;
 IF batch_size<>2 THEN RAISE EXCEPTION 'Product count was not preserved';END IF;
 IF has_table_privilege('anon','public.intake_email_outbox','SELECT') OR
    has_table_privilege('authenticated','public.intake_email_outbox','INSERT') THEN
    RAISE EXCEPTION 'Client table grants unexpectedly present';
 END IF;
 IF has_function_privilege('anon','public.claim_intake_email_batch(integer)','EXECUTE') OR
    has_function_privilege('authenticated','public.complete_intake_email(uuid,uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Client RPC execution unexpectedly present';
 END IF;
 IF NOT has_function_privilege('service_role','public.claim_intake_email_batch(integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Service role cannot claim';
 END IF;
 SELECT id,lease_token INTO b,t FROM public.claim_intake_email_batch(5)
 WHERE request_id='AC-20261015-AAAA0002';
 IF b IS NULL OR t IS NULL THEN RAISE EXCEPTION 'Claim failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.claim_intake_email_batch(5)) THEN
    RAISE EXCEPTION 'Job claimed twice';
 END IF;
 IF public.complete_intake_email(b,gen_random_uuid(),'msg_wrong') THEN
    RAISE EXCEPTION 'Wrong lease was accepted';
 END IF;
 IF NOT public.fail_intake_email(b,t,'HTTP_429') THEN
    RAISE EXCEPTION 'Failed retry was not recorded';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.intake_email_outbox WHERE id=b AND status='retry' AND attempt_count=1) THEN
    RAISE EXCEPTION 'Expected retry status';
 END IF;
 UPDATE public.intake_email_outbox SET next_attempt_at=now()-interval '1 second' WHERE id=b;
 SELECT lease_token INTO t FROM public.claim_intake_email_batch(5) WHERE id=b;
 IF t IS NULL THEN RAISE EXCEPTION 'Retry claim failed';END IF;
 IF NOT public.complete_intake_email(b,t,'msg_123456789') THEN
    RAISE EXCEPTION 'Completion failed';
 END IF;
 IF EXISTS(SELECT 1 FROM public.claim_intake_email_batch(5)) THEN
    RAISE EXCEPTION 'Sent job was reclaimed';
 END IF;
 -- The outbox must not prevent deletion of an otherwise deletable consultation.
 DELETE FROM public.consultations WHERE id=a;
 IF EXISTS(SELECT 1 FROM public.intake_email_outbox WHERE id=b) THEN
    RAISE EXCEPTION 'Cascade deletion did not work';
 END IF;
 INSERT INTO public.consultations(request_id) VALUES('AC-20261015-AAAA0003') RETURNING id INTO a;
 UPDATE public.intake_email_outbox SET created_at=now()-interval '24 hours' WHERE intake_id=a;
 PERFORM * FROM public.claim_intake_email_batch(5);
 IF NOT EXISTS(SELECT 1 FROM public.intake_email_outbox WHERE intake_id=a AND status='needs_review') THEN
    RAISE EXCEPTION 'Stale job was not quarantined';
 END IF;
END $$;
ROLLBACK;
SELECT 'PASS: outbox integration checks' AS result;
