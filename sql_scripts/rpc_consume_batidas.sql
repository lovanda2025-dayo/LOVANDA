-- RPC function to atomically consume batidas
-- Logic: Try to consume from daily_batidas first, then extra_batidas
-- Returns: success boolean, new_daily integer, new_extra integer

CREATE OR REPLACE FUNCTION consume_batidas(
    p_user_id UUID, 
    p_amount INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    new_daily INTEGER,
    new_extra INTEGER,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily INTEGER;
    v_extra INTEGER;
    v_remaining_cost INTEGER;
BEGIN
    -- Lock the row for update
    SELECT daily_batidas, extra_batidas 
    INTO v_daily, v_extra
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    -- Handle nulls
    v_daily := COALESCE(v_daily, 0);
    v_extra := COALESCE(v_extra, 0);
    v_remaining_cost := p_amount;

    -- Check if we have enough total
    IF (v_daily + v_extra) < p_amount THEN
        RETURN QUERY SELECT false, v_daily, v_extra, 'Saldo insuficiente';
        RETURN;
    END IF;

    -- Consume from daily first
    IF v_daily >= v_remaining_cost THEN
        v_daily := v_daily - v_remaining_cost;
        v_remaining_cost := 0;
    ELSE
        v_remaining_cost := v_remaining_cost - v_daily;
        v_daily := 0;
    END IF;

    -- Consume remaining from extra
    IF v_remaining_cost > 0 THEN
        v_extra := v_extra - v_remaining_cost;
    END IF;

    -- Update the profile
    UPDATE profiles
    SET daily_batidas = v_daily,
        extra_batidas = v_extra
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_daily, v_extra, 'Sucesso';
END;
$$;
