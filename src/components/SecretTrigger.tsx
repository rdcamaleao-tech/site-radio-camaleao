import React, { useRef } from 'react';
import { useRadio } from '../context/RadioContext';

interface SecretTriggerProps {
  children: React.ReactNode;
  className?: string;
  holdTimeMs?: number; // Default 5000ms (5 seconds)
}

/**
 * SecretTrigger: Ao pressionar e segurar por 5 segundos seguidos (5000ms),
 * abre o Modal do Painel Administrativo Oculto da Rádio.
 * IMPORTANTE: Sem nenhum indicador visual, barras de progresso ou loaders
 * para garantir total sigilo.
 */
export const SecretTrigger: React.FC<SecretTriggerProps> = ({
  children,
  className = '',
  holdTimeMs = 5000,
}) => {
  const { triggerSecretLogin } = useRadio();
  const timerRef = useRef<number | null>(null);

  const startHold = () => {
    cancelHold();
    timerRef.current = window.setTimeout(() => {
      triggerSecretLogin();
      timerRef.current = null;
    }, holdTimeMs);
  };

  const cancelHold = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanClassName = className.replace(/\bcursor-pointer\b/g, '').trim();

  return (
    <div
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      className={`select-none !cursor-default ${cleanClassName}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
    >
      {children}
    </div>
  );
};
