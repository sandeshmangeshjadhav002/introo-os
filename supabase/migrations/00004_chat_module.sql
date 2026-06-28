-- ============================================
-- Team Chat Module for Introo OS
-- ============================================

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to check if a table is in publication (used for safe realtime setup)
CREATE OR REPLACE FUNCTION is_table_in_publication(pub_name text, schema_name text, table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = pub_name
      AND schemaname = schema_name
      AND tablename = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Channels indexes
CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON public.channels(created_at);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channels RLS policies (safe creation)
DROP POLICY IF EXISTS "Users can view channels in their organization" ON public.channels;
CREATE POLICY "Users can view channels in their organization" ON public.channels
    FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
CREATE POLICY "Users can create channels" ON public.channels
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update channels they created" ON public.channels;
CREATE POLICY "Users can update channels they created" ON public.channels
    FOR UPDATE USING (organization_id = current_organization_id() AND (created_by = auth.uid() OR current_user_role() = 'admin' OR current_user_role() = 'super_admin'));

DROP POLICY IF EXISTS "Admins and creators can delete channels" ON public.channels;
CREATE POLICY "Admins and creators can delete channels" ON public.channels
    FOR DELETE USING (organization_id = current_organization_id() AND (created_by = auth.uid() OR current_user_role() = 'admin' OR current_user_role() = 'super_admin'));

-- Channels triggers (safe creation)
DROP TRIGGER IF EXISTS set_channels_updated_at ON public.channels;
CREATE TRIGGER set_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- CHANNEL MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    last_read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

-- Channel members indexes
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);

-- Enable RLS
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Helper function for channel membership (safe creation)
CREATE OR REPLACE FUNCTION public.is_user_channel_member(channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = is_user_channel_member.channel_id
        AND cm.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Channel members RLS policies (safe creation)
DROP POLICY IF EXISTS "Users can view channel members if they are in the channel" ON public.channel_members;
CREATE POLICY "Users can view channel members if they are in the channel" ON public.channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = channel_members.channel_id
            AND c.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can join public channels" ON public.channel_members;
CREATE POLICY "Users can join public channels" ON public.channel_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = channel_members.channel_id
            AND c.organization_id = current_organization_id()
            AND c.type = 'public'
        )
    );

DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;
CREATE POLICY "Users can leave channels" ON public.channel_members
    FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage channel members" ON public.channel_members;
CREATE POLICY "Admins can manage channel members" ON public.channel_members
    FOR ALL USING (
        current_user_role() IN ('super_admin', 'admin') AND
        EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = channel_members.channel_id
            AND c.organization_id = current_organization_id()
        )
    );

-- Channel members triggers (safe creation)
DROP TRIGGER IF EXISTS set_channel_members_updated_at ON public.channel_members;
CREATE TRIGGER set_channel_members_updated_at
    BEFORE UPDATE ON public.channel_members
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_message_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS policies (safe creation)
DROP POLICY IF EXISTS "Users can view messages in channels they belong to" ON public.messages;
CREATE POLICY "Users can view messages in channels they belong to" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = messages.channel_id
            AND c.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create messages in channels they belong to" ON public.messages;
CREATE POLICY "Users can create messages in channels they belong to" ON public.messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.channels c
            WHERE c.id = messages.channel_id
            AND c.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (user_id = auth.uid());

-- Messages triggers (safe creation)
DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;
CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Message reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Message reactions RLS policies (safe creation)
DROP POLICY IF EXISTS "Users can view reactions in channels they belong to" ON public.message_reactions;
CREATE POLICY "Users can view reactions in channels they belong to" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.channels c ON m.channel_id = c.id
            WHERE m.id = message_reactions.message_id
            AND c.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can add reactions to messages" ON public.message_reactions;
CREATE POLICY "Users can add reactions to messages" ON public.message_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Trigger to auto-add creator as channel member
-- ============================================
CREATE OR REPLACE FUNCTION public.add_channel_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_channel_create_add_creator ON public.channels;
CREATE TRIGGER on_channel_create_add_creator
    AFTER INSERT ON public.channels
    FOR EACH ROW EXECUTE FUNCTION public.add_channel_creator_as_member();

-- ============================================
-- REALTIME ENABLEMENT FOR CHAT (safe)
-- ============================================
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'channels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'channel_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'message_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;
