create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'retry-webhooks-every-minute';

select cron.schedule(
  'retry-webhooks-every-minute',
  '* * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'retry-webhooks-url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Venti-Internal-Secret',
          (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch-webhook-secret')
      ),
      body := '{}'::jsonb
    );
  $job$
);
