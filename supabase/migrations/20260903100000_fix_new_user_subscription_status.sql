CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    business_name TEXT;
    base_slug TEXT;
    final_slug TEXT;
    v_tenant_id UUID;
    v_plan subscription_plan;
    v_period_start TIMESTAMPTZ;
    v_is_trial BOOLEAN;
    v_trial_ends_at TIMESTAMPTZ;
    v_plan_status subscription_status;
BEGIN
    business_name := new.raw_user_meta_data->>'business_name';

    IF business_name IS NULL THEN
        RETURN NEW;
    END IF;

    base_slug := lower(trim(both '-' from regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g')));

    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'store';
    END IF;

    final_slug := base_slug;

    WHILE EXISTS (
        SELECT 1
        FROM public.tenants
        WHERE slug = final_slug
           OR subdomain = final_slug
    ) LOOP
        final_slug := base_slug || '-' || (SELECT COUNT(*) + 1 FROM public.tenants WHERE slug LIKE base_slug || '%');
    END LOOP;

    v_plan := (COALESCE(new.raw_user_meta_data->>'plan', 'free'))::subscription_plan;
    v_is_trial := COALESCE(new.raw_user_meta_data->>'subscription_mode', 'paid') = 'trial';
    v_plan_status := CASE WHEN v_is_trial THEN 'trial'::subscription_status ELSE 'active'::subscription_status END;
    v_trial_ends_at := CASE
        WHEN v_is_trial THEN NOW() + INTERVAL '14 days'
        ELSE NULL
    END;

    INSERT INTO public.tenants (
        business_name,
        slug,
        subdomain,
        owner_id,
        contact_email,
        status,
        plan,
        plan_status,
        trial_ends_at,
        subscription_ends_at
    )
    VALUES (
        business_name,
        final_slug,
        final_slug,
        new.id,
        new.email,
        'active',
        v_plan,
        v_plan_status,
        v_trial_ends_at,
        NULL
    )
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.tenant_members (
        tenant_id,
        user_id,
        role,
        is_active,
        joined_at
    )
    VALUES (
        v_tenant_id,
        new.id,
        'admin',
        true,
        NOW()
    );

    v_period_start := NOW();

    INSERT INTO public.subscription_history (
        tenant_id,
        plan,
        status,
        amount,
        currency,
        billing_period_start,
        billing_period_end,
        payment_method,
        payment_id,
        metadata
    )
    VALUES (
        v_tenant_id,
        v_plan,
        v_plan_status,
        CASE WHEN v_is_trial THEN 0 ELSE NULL END,
        'COP',
        v_period_start,
        CASE
            WHEN v_is_trial THEN v_trial_ends_at
            ELSE v_period_start + INTERVAL '1 month'
        END,
        CASE WHEN v_is_trial THEN 'free_trial' ELSE NULL END,
        NULL,
        jsonb_build_object(
            'source', 'handle_new_user',
            'user_id', new.id,
            'subscription_mode', CASE WHEN v_is_trial THEN 'trial' ELSE 'paid' END
        )
    );

    PERFORM public.create_default_email_templates(v_tenant_id);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$;
