-- Fix the broken trigger function from 00007 that crashes on organization creation
-- The previous trigger used ON CONFLICT (organization_id, name) on deal_stages which lacks that unique constraint.

CREATE OR REPLACE FUNCTION public.create_default_pipeline()
RETURNS TRIGGER AS $$
DECLARE
    v_pipeline_id UUID;
BEGIN
    -- Create default pipeline
    INSERT INTO public.pipelines (organization_id, name, position, is_default)
    VALUES (NEW.id, 'Sales Pipeline', 1, TRUE)
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO v_pipeline_id;

    -- Create default deal stages linked to pipeline
    IF v_pipeline_id IS NOT NULL THEN
        INSERT INTO public.deal_stages (organization_id, pipeline_id, name, position, color, probability, is_closed)
        VALUES
            (NEW.id, v_pipeline_id, 'New', 1, '#6366f1', 10, FALSE),
            (NEW.id, v_pipeline_id, 'Qualified', 2, '#0ea5e9', 25, FALSE),
            (NEW.id, v_pipeline_id, 'Proposal', 3, '#f59e0b', 50, FALSE),
            (NEW.id, v_pipeline_id, 'Negotiation', 4, '#f97316', 75, FALSE),
            (NEW.id, v_pipeline_id, 'Won', 5, '#10b981', 100, TRUE),
            (NEW.id, v_pipeline_id, 'Lost', 6, '#ef4444', 0, TRUE);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
