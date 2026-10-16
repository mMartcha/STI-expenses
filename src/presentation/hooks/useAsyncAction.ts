import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useDependencies } from '../providers/DependenciesProvider';
import { errorMessage } from '../utils/errors';

/** Envolve uma ação de tela: registra o erro e mostra mensagem traduzida ao usuário. */
export function useErrorAlert() {
  const { t } = useTranslation();
  const { logger } = useDependencies();

  return (error: unknown) => {
    logger.warn('Ação falhou', { error: error instanceof Error ? error.message : String(error) });
    Alert.alert(errorMessage(error, t));
  };
}
