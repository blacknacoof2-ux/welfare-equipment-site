-- OPTIONAL, NOT APPLIED: run only after confirming the production Supabase project.
-- Creates a durable, privacy-minimal outbox for NEW consultation records.
-- No backfill: existing consultations do not generate notifications.
BEGIN;

CREATE TABLE IF NOT EXISTS public.intake_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE RESTRICT,
  event_type text NOT NULL DEFAULT 'consultation.created'
    CHECK (event_type = 'consultation.created'),
  request_id text NOT NULL,
  submitted_at timestamptz NOT NULL,
  product_count integer NOT NULL DEFAULT 0 CHECK (product_count >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'needs_review')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  leased_until timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (intake_id, event_type)
);

CREATE INDEX IF NOT EXISTS intake_email_outbox_claim_idx
  ON public.intake_email_outbox (status, next_attempt_at, created_at);

ALTER TABLE public.intake_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.intake_email_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intake_email_outbox TO service_role;
-- No client-facing RLS policy is created. Only privileged server workers access it.

CREATE OR REPLACE FUNCTION public.enqueue_intake_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.intake_email_outbox (
    intake_id, request_id, submitted_at, product_count
  )
  VALUES (
    NEW.id,
    NEW.request_id,
    NEW.submitted_at,
    CASE WHEN jsonb_typeof(NEW.items) = 'array'
      THEN jsonb_array_length(NEW.items) ELSE 0 END
  )
  ON CONFLICT (intake_id, event_type) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_intake_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS consultation_enqueue_intake_email ON public.consultations;
CREATE TRIGGER consultation_enqueue_intake_email
AFTER INSERT ON public.consultations
FOR EACH ROW EXECUTE FUNCTION public.enqueue_intake_email();

CREATE OR REPLACE FUNCTION public.claim_intake_email_batch(p_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  request_id text,
  submitted_at timestamptz,
  product_count integer,
  lease_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Resend only deduplicates for 24h. Older/uncertain tasks require manual review.
  UPDATE public.intake_email_outbox o
  SET status = 'needs_review',
      last_error_code = 'RETRY_WINDOW_EXPIRED',
      lease_token = NULL,
      leased_until = NULL
  WHERE (o.status IN ('pending', 'retry')
      OR (o.status = 'processing' AND o.leased_until < now()))
    AND (o.created_at < now() - interval '23 hours' OR o.attempt_count >= 4);

  RETURN QUERY
  WITH candidates AS (
    SELECT o.id
    FROM public.intake_email_outbox o
    WHERE (
      o.status IN ('pending', 'retry')
      OR (o.status = 'processing' AND o.leased_until < now())
    )
      AND o.next_attempt_at <= now()
      AND o.created_at >= now() - interval '23 hours'
      AND o.attempt_count < 4
    ORDER BY o.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 5), 10))
  ),
  claimed AS (
    UPDATE public.intake_email_outbox o
    SET status = 'processing',
        attempt_count = o.attempt_count + 1,
        lease_token = gen_random_uuid(),
        leased_until = now() + interval '2 minutes'
    FROM candidates c
    WHERE o.id = c.id
    RETURNING o.id, o.request_id, o.submitted_at, o.product_count, o.lease_token
  )
  SELECT c.id, c.request_id, c.submitted_at, c.product_count, c.lease_token
  FROM claimed c;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_intake_email(
  p_job_id uuid, p_lease_token uuid, p_provider_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.intake_email_outbox
  SET status = 'sent',
      provider_message_id = left(p_provider_id, 200),
      sent_at = now(),
      lease_token = NULL,
      leased_until = NULL,
      last_error_code = NULL
  WHERE id = p_job_id AND lease_token = p_lease_token AND status = 'processing';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_intake_email(
  p_job_id uuid, p_lease_token uuid, p_error_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.intake_email_outbox
  SET status = CASE
        WHEN attempt_count >= 4 OR created_at < now() - interval '23 hours'
          THEN 'needs_review' ELSE 'retry' END,
      next_attempt_at = now() + make_interval(secs => CASE
        WHEN attempt_count = 1 THEN 60
        WHEN attempt_count = 2 THEN 300
        ELSE 900 END),
      last_error_code = left(regexp_replace(upper(coalesce(p_error_code, 'UNKNOWN')), '[^A-Z0-9_]', '', 'g'), 64),
      lease_token = NULL,
      leased_until = NULL
  WHERE id = p_job_id AND lease_token = p_lease_token AND status = 'processing';
  RETURN FOUND;
END;
$$;

-- Public schema RPCs need an explicit deny: functions grant EXECUTE to PUBLIC by default.
REVOKE ALL ON FUNCTION public.claim_intake_email_batch(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_intake_email(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_intake_email(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_intake_email_batch(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_intake_email(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_intake_email(uuid, uuid, text) TO service_role;

COMMIT;
