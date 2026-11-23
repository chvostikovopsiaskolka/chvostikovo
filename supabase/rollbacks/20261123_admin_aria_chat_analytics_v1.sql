-- Only remove the report RPC; no tracked events or customer data are deleted.
DROP FUNCTION IF EXISTS public.admin_aria_chat_analytics_v1(date,date,text);
