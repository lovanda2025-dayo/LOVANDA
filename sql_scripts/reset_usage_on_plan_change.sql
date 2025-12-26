-- Trigger para resetar contadores e recarregar batidas quando o plano muda
-- Isso garante que o usuário receba os benefícios do novo plano IMEDIATAMENTE

CREATE OR REPLACE FUNCTION handle_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o tipo de plano mudou (comparação segura contra NULL)
    IF OLD.plan_type IS DISTINCT FROM NEW.plan_type THEN
        
        -- 1. Resetar contadores de uso (zerar para o novo plano)
        NEW.daily_stories := 0;
        NEW.daily_comments := 0;
        NEW.daily_swipes := 0;
        
        -- 2. Recarregar Batidas Diárias com o valor total do NOVO plano
        NEW.daily_batidas := CASE 
            WHEN NEW.plan_type ILIKE 'premium' THEN 30
            WHEN NEW.plan_type ILIKE 'vip' THEN 20
            ELSE 10 -- sanzala
        END;
        
        -- 3. Atualizar a data de reset para "agora", marcando o início do ciclo do novo plano
        NEW.last_reset_date := NOW();
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove o trigger antigo se existir para evitar duplicação ou erro
DROP TRIGGER IF EXISTS on_plan_change ON profiles;

-- Recria o trigger
CREATE TRIGGER on_plan_change
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_plan_change();
